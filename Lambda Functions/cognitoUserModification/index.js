import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ap-south-1" });
const USER_POOL_ID = "ap-south-1_suJyeLYlR";

export const handler = async (event) => {
  const key = event.queryStringParameters?.key;
  const body = event.body ? JSON.parse(event.body) : {};
  const targetUsername = body.username;

  // Get the caller's username from the JWT claims
  const callerUsername = event.requestContext?.authorizer?.claims?.["cognito:username"];

  if (!targetUsername) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required 'username' field." })
    };
  }

  // Prevent self-modification or deletion
  if ((key === "modify" || key === "delete") && targetUsername === callerUsername) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Admins cannot modify or delete themselves." })
    };
  }

  try {
    if (key === "create") {
      const { email, group } = body;

      await client.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: targetUsername,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" }
        ],
        TemporaryPassword: "TempPass#123",
        MessageAction: "SUPPRESS"
      }));

      if (group) {
        await client.send(new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: targetUsername,
          GroupName: group
        }));
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: `User '${targetUsername}' created successfully.` })
      };

    } else if (key === "modify") {
      const attributes = body.attributes;

      if (!Array.isArray(attributes)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing or invalid 'attributes' array." })
        };
      }

      await client.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: targetUsername,
        UserAttributes: attributes
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: `User '${targetUsername}' updated successfully.` })
      };

    } else if (key === "delete") {
      await client.send(new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: targetUsername
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: `User '${targetUsername}' deleted successfully.` })
      };

    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid 'key' query parameter. Use create, modify, or delete." })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
