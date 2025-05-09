// Required Libraries
const imaps = require('imap-simple');
const PDFDocument = require('pdfkit');
const { WritableStreamBuffer } = require('stream-buffers');
const { simpleParser } = require('mailparser');


// AWS SDK v3 imports
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');


//AWS instances wrt region of operation
const s3 = new S3Client({ region: 'ap-south-1' });
const dynamo = new DynamoDBClient({ region: 'ap-south-1' });
const secretsManager = new SecretsManagerClient({ region: 'ap-south-1' });

//keyworks based threat classification
const KEYWORDS = ['threat', 'malware', 'attack', 'virus', 'phishing'];


let processedUIDs = new Set();

//AWS Lambda functionality code and needs other implementation for local machine
exports.handler = async (event) => {
  //Global availability of connection
  let connection;

  try {

    //Setting up environment variables
    const SECRET_ID = process.env.SECRET_ID;
    const BUCKET_NAME = process.env.BUCKET_NAME;
    const TABLE_NAME = process.env.TABLE_NAME;

    //Using AWS Secrets Manager for securing email credentials
    const secretResponse = await secretsManager.send(
      new GetSecretValueCommand({ SecretId: SECRET_ID })
    );
    const creds = JSON.parse(secretResponse.SecretString);

    //API CREDENTIALS
    const AI_API = creds.AI_API;



    //Configuration of IMAP 
    const imapConfig = {
      imap: {
        user: creds.EMAIL_USER,
        password: creds.EMAIL_PASS,
        host: creds.IMAP_HOST,
        port: parseInt(creds.IMAP_PORT),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 5000
      }
    };

    //Wait for succesfull connection with services
    connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    //Capture only UNREAD MAILS
    const messages = await connection.search(['UNSEEN'], {
      bodies: [''], //Calling for RAW data
      struct: true
    });

    
    //Mails are iterated through 
      for (const msg of messages) {

        const uid = msg.attributes.uid;
        if (processedUIDs.has(uid)) continue;

        //Conversion of RAW data to Structured data
        const allParts = msg.parts.find(p => p.which === '');
        const parsed = await simpleParser(allParts.body);

        const subject = parsed.subject || '';
        const body = parsed.text || parsed.html || '';
        const from = parsed.from?.text || 'Unknown Sender';
        const date = parsed.date || new Date();

        //Keywords based email check
        const isThreat = KEYWORDS.some(keyword =>
          subject.toLowerCase().includes(keyword) || body.toLowerCase().includes(keyword)
        );


        if (isThreat) {


          //Waiting for response on Threat campaign, type and suspected I.P.(s)
          const responseAI = await promtProcessor(body, AI_API);



          //Writing PDF in Memory not disk, keeps data safe even at rest
          const bufferWriter = new WritableStreamBuffer();
          const doc = new PDFDocument();
          doc.pipe(bufferWriter);
          doc.fontSize(14).text(`From: ${from}`);
          doc.text(`Subject: ${subject}`);
          doc.text(`Date: ${date}`);
          doc.moveDown();
          doc.fontSize(12).text(body || '[No content]');
          doc.end();

          //When PDF is written, an object is made available for operating on it
          await new Promise(resolve => doc.on('end', resolve));
          const pdfBuffer = bufferWriter.getContents();
          const filename = `email_${uid}_${Date.now()}.pdf`;

          //AWS S3 Bucket stores PDF 
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `emails/${filename}`,
            Body: pdfBuffer,
            ContentType: 'application/pdf'
          }));

          //AWS DynamoDB stores PDF metadata
          await dynamo.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
              emailUid: {S : uid},
              from: { S: from },
              subject: { S: subject },
              date: { S: date.toISOString() },
              s3Key: { S: `emails/${filename}` },
              campaign: { S: responseAI.campaign },
              type: { S: responseAI.type},
              suspect_ip: { S: responseAI.suspect_ip},
              isActive: { S: true}
            }
          }));

          //Marking threat related emails as seen
          await connection.addFlags(uid, '\\Seen');
          console.log(`Processed & marked as read: ${filename}`);
        } else {

          //Marking non-threat related emails as unseen
          await connection.delFlags(uid, '\\Seen');
          console.log(`Skipped (non-threat) & marked unread: UID ${uid}`);
        }

        //Adding to list of processed emails such that no operation is duplicated
        processedUIDs.add(uid);
      
    }

    //For server testing & validating script
    return { status: 'Done' };

  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;

  } finally {
    //Connection is always closed regardless
    if (connection) {
      try {
        await connection.end();
        console.log('Connection closed.');
      } catch (endErr) {
        console.warn('Failed to close connection:', endErr);
      }
    }
  }
};



//Function for Prompt Processing
async function promtProcessor(email, API) {

  const prompt = `
  Given the following email content, extract the following fields in JSON & RESPOND ONLY FINAL ANSWER:
  - Threat Campaign
  - Severity of Threat (High, Medium, Low, Urgent) adjust for nuance
  - Suspected IPs of Threat
  the JSON format should be :
  - campaign
  - type
  - suspect_ip
  Email:
  ${email}
  `;

  //Generating a response from AI to get Threat properties 
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${API}`,
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          "model": "microsoft/phi-4-reasoning:free",
          "messages": [
              {
                  "role": "user",
                  "content": prompt
              }
          ]
      })
  });

  //Conversion to JSON format
  const jsonResponse = await response.json();
  const result =  jsonResponse.choices[0].message.content;

  const matches = [...result.matchAll(/{[\s\S]*?}/g)];


  if (matches.length > 0) {
  // Get the last JSON-like block
  let lastJsonLike = matches[matches.length - 1][0];

  // Fix format to valid JSON
  lastJsonLike = lastJsonLike.replace(/(\w+)\s*:\s*([^,\n}]+)/g, (m, key, value) => {
      key = `"${key.trim()}"`;
      value = `"${value.trim()}"`;
      return `${key}: ${value}`;
  });

  let parsed;
  try {
      parsed = JSON.parse(lastJsonLike);
      return parsed;
  } catch (e) {
      console.error("Failed to parse JSON:", e);
      return e;
  }
  } else {
  console.log("No JSON-like structure found.");
  return "Error"
}
}

