// Required Libraries
const { main } = require('./promptProcessor.js'); 
const imaps = require('imap-simple');
const { WritableStreamBuffer } = require('stream-buffers');
const { simpleParser } = require('mailparser');
const PDFDocument = require('pdfkit');


// AWS SDK v3 imports
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');


//AWS instances wrt region of operation
const s3 = new S3Client({ region: 'ap-south-1' });
const dynamo = new DynamoDBClient({ region: 'ap-south-1' });
const secretsManager = new SecretsManagerClient({ region: 'ap-south-1' });



let processedUIDs = new Set();

//AWS Lambda functionality code and needs other implementation for local machine
exports.handler = async (event) => {
  //Global availability of connection
  let connection;
  //keyworks based threat classification
  const token = event.headers?.authorization?.slice(7);
  const KEYWORDS = await fetchData('TABLE3',token);

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
    const API_KEY = creds.API_KEY;



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

        // Extract raw message part
        const allParts = msg?.parts?.find(p => p.which === '');
        if (!allParts?.body) {
          throw new Error('Email message body not found.');
        }

        // Parse raw email content
        const parsed = await simpleParser(allParts.body);

        // Structured fields
        const subject = parsed.subject || '[No Subject]';
        const from = parsed.from?.text || 'Unknown Sender';
        const date = parsed.date ? parsed.date.toISOString() : new Date().toISOString();

        // Prefer HTML body if available for formatting
        const htmlBody = parsed.html || `<pre>${parsed.text || '[No content]'}</pre>`;
        const rawTextBody = parsed.text || parsed.html || '[No content]';


        //Keywords based email check
        const isThreat = KEYWORDS.some(keyword =>
          from.toLowerCase().includes(keyword)
        );


        if (isThreat) {


          //Waiting for response on Threat campaign, type and suspected I.P.(s)
        
          const responseAI = await main(API_KEY, rawTextBody);
          console.log(responseAI);

          // Build HTML safely
          //Writing PDF in Memory not disk, keeps data safe even at rest
          const bufferWriter = new WritableStreamBuffer();
          const doc = new PDFDocument();
          doc.pipe(bufferWriter);
          doc.fontSize(14).text(`From: ${from}`);
          doc.text(`Subject: ${subject}`);
          doc.text(`Date: ${date}`);
          doc.moveDown();
          doc.fontSize(12).text(rawTextBody || '[No content]');
          doc.end();

          //When PDF is written, an object is made available for operating on it
          await new Promise(resolve => doc.on('end', resolve));
          const pdfBuffer = bufferWriter.getContents();
          const filename = `email_${uid}_${Date.now()}.pdf`;


          
          const match = from.match(/<([^>]+)>/);
          const emailOnly = match ? match[1] : null;

          //AWS S3 Bucket stores PDF 
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `emails/${filename}`,
            Body: pdfBuffer,
            ContentType: 'application/pdf'
          }));

          // //AWS DynamoDB stores PDF metadata
          await dynamo.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
              emailUid : {S : String(uid)},
              from: { S: emailOnly },
              subject: { S: subject },
              date: { S: date },
              s3Key: { S: `emails/${filename}` },
              campaign: { S: responseAI.campaign },
              type: { S: responseAI.type},
              summary: { S: responseAI.summary},
              suspect_ip: { S: responseAI.suspect_ip},
              isActive: { S: 'true'}
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
    return {
      status: 200,
      headers: { 
        'Allow-Cross-Origin-Access': '*',
        'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Emails processed successfully.' })
    };

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

async function fetchData(key, token){
  try {
    if(key === 'TABLE3'){
         const url = `https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo?key=${encodeURIComponent('TABLE3')}`;
         const response = await getAuth(url, token);
         let sendersData = [];
         if(response && Array.isArray(response) && response.length > 0){
             response.forEach(item => {
                 sendersData.push(item.sender.S);
             })
         }
         return sendersData;
     } 
 }catch (error) {
     console.log(`Error : ${error}`);
     return [];
 }
}


async function getAuth(url, token){
  try {
      const response = await fetch(url, {
          method: "GET",
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
          }
      });
      let data = await response.json();
      return data;
  } catch (error) {
      return error;
  }
}
