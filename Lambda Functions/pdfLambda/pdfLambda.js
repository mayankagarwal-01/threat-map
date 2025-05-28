const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: "ap-south-1" });

const BUCKET_NAME = process.env.BUCKET_NAME; 
const URL_EXPIRY_SECONDS = 300; // 5 minutes

exports.handler = async (event) => {
  try {
    const key = event.queryStringParameters?.key;
    // const key = 'emails/email_18796_1747031540253.pdf';

    if (!key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing S3 key" }),
      };
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: URL_EXPIRY_SECONDS,
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ presignedUrl }),
    };
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error generating URL", error: error.message }),
    };
  }
};
