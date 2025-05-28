const {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    ListGroupsForUserCommand
  } = require("@aws-sdk/client-cognito-identity-provider");
  
  const client = new CognitoIdentityProviderClient({ region: "ap-south-1" });
  
  const USER_POOL_ID = process.env.USER_POOL_ID;
  
  exports.handler = async (event) => {
    try {
      const users = [];
      let paginationToken;
  
      do {
        const listUsersResponse = await client.send(new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          PaginationToken: paginationToken,
          Limit: 60
        }));
  
        for (const user of listUsersResponse.Users) {
          const username = user.Username;
          const emailAttr = user.Attributes.find(attr => attr.Name === "email");
          const email = emailAttr ? emailAttr.Value : null;
          const enabled = user.Enabled;

          console.log("Type of ListGroupsForUserCommand:", typeof ListGroupsForUserCommand);

          const command = new ListGroupsForUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: username
          });
          const result = await client.send(command);
          console.log(result.Groups);
  
          // const groups = groupsResponse.Groups?.map(g => g.GroupName) || [];
  
          users.push({ username, email, enabled });
        }
  
        paginationToken = listUsersResponse.PaginationToken;
      } while (paginationToken);
  
      return {
        statusCode: 200,
        body: JSON.stringify({ users })
      };
  
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  };
  