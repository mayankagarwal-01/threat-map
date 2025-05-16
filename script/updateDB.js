const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: "ap-south-1" });


exports.handler = async (event) => {
  try {
    const tableName = process.env.TABLE_NAME;

    if (!tableName) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Table name not configured" })
      };
    }

    const partitionKeyValue = event.queryStringParameters?.id;


    if (!partitionKeyValue) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing ID in the URL path" })
      };
    }

    let parsedBody;

    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseErr) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }
    const { remarks } = parsedBody;
    console.log(remarks);


    if (remarks === undefined) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing 'remarks' in request body" })
      };
    }


    const command = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        "emailUid": { S: partitionKeyValue },
        "from": { S: "default"},
      },
      UpdateExpression: "SET remarks = :remarks",
      ExpressionAttributeValues: {
        ":remarks": { S: remarks }
      },
      ReturnValues: "ALL_NEW"
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Remarks updated successfully",
      })
    };

  } catch (error) {
    console.error("Error updating remarks:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Failed to update remarks", details: error.message })
    };
  }
};
