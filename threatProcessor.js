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
    const AI_API = process.env.AI_API;

    //Using AWS Secrets Manager for securing email credentials
    const secretResponse = await secretsManager.send(
      new GetSecretValueCommand({ SecretId: SECRET_ID })
    );
    const creds = JSON.parse(secretResponse.SecretString);


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

        // //Removing Boiler plate
        // body = body.replace(/--\s*\n[\s\S]+$/, '')
        //        .replace(/This email and any attachments.*$/is, '')
        //        .replace(/To unsubscribe.*$/is, '')
        //        .replace(/Regards,\s*[\s\S]+$/i, '')
        //        .trim();

        
        const prompt = `
        Given the following email content, extract the following fields in JSON:
        - Threat Campaign
        - Threat Summary
        - Suspected I.P. Address of Threat
        Email:
        ${parsed}
        `;


        //Keywords based email check
        const isThreat = KEYWORDS.some(keyword =>
          subject.toLowerCase().includes(keyword) || body.toLowerCase().includes(keyword)
        );


        if (isThreat) {

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
              from: { S: from },
              subject: { S: subject },
              date: { S: date.toISOString() },
              s3Key: { S: `emails/${filename}` },
              summary: { S: 'SUMMARY using LLM' },
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
