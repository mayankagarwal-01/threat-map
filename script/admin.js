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

    bodyBuild('users', await fetchData('users'));
    bodyBuild('senders', await fetchData('senders'));


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

function isEmpty(tbody) {
  
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = sendersData.length === 0 ? 'block' : 'none';

}

async function fetchData(key) {
    try {
       if(key==='users'){
        return await fetchCognitoUsers();
       }else if(key==='senders'){
            const url = `https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo?key=${encodeURIComponent('TABLE3')}`;
            const token = localStorage.getItem("id_token");
            const response = await getAuth(url, token);
            if(response && Array.isArray(response) && response.length > 0){
                response.forEach(item => {
                    sendersData.push(item.sender.S);
                })
            }
            isEmpty();
            return sendersData;
        } 
    }catch (error) {
        console.log(`Error : ${error}`);
        return [];
    }
}



// Function to fetch Cognito users
async function fetchCognitoUsers() {
    const url = ` https://o452w010wj.execute-api.ap-south-1.amazonaws.com/default/cognito-users`;
    try {
        const token = localStorage.getItem("id_token");
        const response = await getAuth(url, token);
        
        if(response) {
            // Clear existing users data
            usersData.length = 0;
            
            const cognitoUsers = response.users.map(user => {
                const userData = {
                    username: user.username,
                    email: user.email || 'N/A',
                    enabled: user.enabled,
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

  async function bodyBuild(key, data) {

    if(key === 'users'){

        const userTable = document.getElementById('users-table');
        const userTableBody = userTable.querySelector('tbody');
        userTableBody.innerHTML = '';
        for (let i = 0; i < data.length; i++) {
            const tr = document.createElement('tr');
            
                tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${data[i].username}</td>
                <td>${data[i].group}</td>
                <td>${data[i].enabled ? 'Enabled' : 'Disabled'}</td>
                <td><i class="fa-solid fa-pen-to-square cursor-pointer text-2xl"></i></td>
            `;
            userTableBody.appendChild(tr);      
        }
        userTableBody.classList.remove('skeleton');
    }else if(key === 'senders'){

        const senderTable = document.getElementById('senders-table');
        const senderTableBody = senderTable.querySelector('tbody');
        senderTableBody.innerHTML = '';
        for (let i = 0; i < data.length; i++) {
            const tr = document.createElement('tr');
                tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${data[i]}</td>
                <td><i class="fa-solid fa-pen-to-square cursor-pointer text-2xl"></i></td>
            `;
            senderTableBody.appendChild(tr);      
        }
        senderTableBody.classList.remove('skeleton');

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