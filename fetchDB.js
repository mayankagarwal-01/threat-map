const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: "ap-south-1" });

//Lambda Function Defination 
exports.handler = async (event) => {

    const TABLE_NAME = process.env.TABLE_NAME
    let items = [];
    let ExclusiveStartKey; //For pagination i.e. if DB fails to load all records 
    
    try {
        do{
            const command = new ScanCommand({
                TableName: TABLE_NAME,
                ExclusiveStartKey: ExclusiveStartKey,
            });
            const response = await client.send(command);
            items = items.concat (response.Items);
            ExclusiveStartKey = response.LastEvaluatedKey;
        }while(ExclusiveStartKey);

        //If data is fetched successfully for API fetch 
        return {
            statusCode: 200,
            body: JSON.stringify(items),
        };
    } catch (error) {
            console.error("Error scanning DynamoDB:", error);
            return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to scan DynamoDB" }),
            };
    }
};