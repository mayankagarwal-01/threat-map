let usersData = [];
let sendersData = [];

document.addEventListener('DOMContentLoaded', async () => {

    token = localStorage.getItem("id_token");
    
    // If token doesn't exist, hence no authentication then return to login page
    if (!token) {
        alert("Not logged in. Redirecting to login...");
        window.location.href = "login.html";
        return;
    }
    
    // Check if user is admin
    if (!isAdmin()) {
        alert("Access denied. Admin privileges required.");
        localStorage.clear();
        window.location.href = "login.html";
        return;
    }

    console.log(fetchData('users'));

});

// Function to check if user is admin
function isAdmin() {
    try {
        const token = localStorage.getItem("id_token");
        if (!token) return false;
        
        const decodedToken = decodeJWT(token);
        const userGroups = decodedToken['cognito:groups'] || [];
        
        return userGroups.includes('Admin');
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Function to decode JWT token
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        throw new Error('Invalid JWT token');
    }
}

async function fetchData(key) {
    try {
       if(key==='users'){
        return await fetchCognitoUsers();
       }else{
            const url = `https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo?key=${encodeURIComponent(key)}`;
            const token = localStorage.getItem("id_token");
            const response = await getAuth(url, token);
            
            if(response && Array.isArray(response) && response.length > 0){
                const unwrappedData = response.map(item => {
                    return {
                        sender: item.sender.S
                    }
                })
            }
        } 
    }catch (error) {
        console.log(`Error : ${error}`);
        return [];
    }
}

// Function to fetch Cognito users
async function fetchCognitoUsers() {
    const url = `https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/cognito-users`;
    try {
        const token = localStorage.getItem("id_token");
        const response = await getAuth(url, token);
        
        if(response && Array.isArray(response) && response.length > 0) {
            // Clear existing users data
            usersData.length = 0;
            
            const cognitoUsers = response.map(user => {
                const userData = {
                    username: user.Username,
                    email: user.Attributes?.find(attr => attr.Name === 'email')?.Value || 'N/A',
                    status: user.UserStatus,
                    enabled: user.Enabled,
                    groups: user.Groups || []
                };
                
                usersData.push(userData);
                return userData;
            });
            
            return cognitoUsers;
        }
        return [];
    } catch (error) {
        console.log(`Error fetching Cognito users: ${error}`);
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
            },
        });
        
        // If login not proper
        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "login.html";
            return null;
        }
        
        let data = await response.json();
        return data;
    } catch (error) {
        return error;
    }
}