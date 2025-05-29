import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });

export const handler = async (event) => {
  const TABLE_NAME = process.env.TABLE_NAME;
  const action = event.action; // "create" | "update" | "delete"
  const item = event.item;

  try {
    if (action === "create") {
      const params = {
        TableName: TABLE_NAME,
        Item: {
            sender: {S: item.sender}
        }
      };
      await client.send(new PutItemCommand(params));
      return { statusCode: 200, body: "Item created successfully" };

    } else if (action === "update") {
        const { oldSender, newSender } = item;

        // 1. Get the existing item by old sender
        const getParams = {
            TableName: TABLE_NAME,
            Key: {
            sender: { S: oldSender }
            }
        };
        const getResponse = await client.send(new GetItemCommand(getParams));

        if (!getResponse.Item) {
            return { statusCode: 404, body: "Item with oldSender not found" };
        }

        const existingItem = getResponse.Item;

        // 2. Create new item with new sender
        existingItem.sender = { S: newSender }; // Replace the key

        const putParams = {
            TableName: TABLE_NAME,
            Item: existingItem
        };
        await client.send(new PutItemCommand(putParams));

        // 3. Delete old item
        const deleteParams = {
            TableName: TABLE_NAME,
            Key: {
            sender: { S: oldSender }
            }
        };
        await client.send(new DeleteItemCommand(deleteParams));

        return { statusCode: 200, body: "Sender updated successfully" };

    } else if (action === "delete") {
      const params = {
        TableName: TABLE_NAME,
        Key: {
          sender: { S: item.sender }
        }
      };
      await client.send(new DeleteItemCommand(params));
      return { statusCode: 200, body: "Item deleted successfully" };

    } else {
      return { statusCode: 400, body: "Invalid action" };
    }
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error processing request" };
  }
};
