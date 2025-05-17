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
    const fromValue = event.queryStringParameters?.fromValue;
    const updateType = event.queryStringParameters?.type || 'remarks';




    if (!partitionKeyValue) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing ID in the URL path" })
      };
    }

    if (!fromValue) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Missing From Value in the URL path" })
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

    if(updateType === 'activity'){
      const { activity } = parsedBody;
      if(activity === undefined){
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ error: "Missing 'Activity' in request body" })
        };
      }
      const updateValue = !(activity.toString() === 'true');
      const command = new UpdateItemCommand({
        TableName: tableName,
        Key: {
          "emailUid": { S: partitionKeyValue },
          "from": { S: fromValue},
        },
        UpdateExpression: "SET isActive = :activity",
        ExpressionAttributeValues: {
          ":activity": { S: updateValue.toString() }
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
          message: "Activity updated successfully",
        })
      };


    }

    const { remarks } = parsedBody;


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
        "from": { S: fromValue},
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
    console.error("Error updating data:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Failed to update data", details: error.message })
    };
  }
};
