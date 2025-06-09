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

async function adminAction(){
    const actionBtn = event.target;
    const key = actionBtn.getAttribute('key');
    let eventKey;
    let body;
    let username, email, password, group, sender;
    const invalid = Array.from(document.querySelectorAll('input'))
        .filter(input => input.offsetParent !== null && !input.value);

    if (invalid.length > 0) {
        alert('Please fill all required fields.');
        return;
    }
    switch(key){
        case 'create-user':
            eventKey = 'create';
            username = document.getElementById('username')
            email = document.getElementById('email')
            password = document.getElementById('temp_pass')
            group = document.getElementById('group')
            
            body = {
                "username": username.value,
                "email": email.value ,
                "password": password.value ,
                "group": group.value
            }
            break;
        case 'update-user':
            eventKey = 'modify';
            username = document.getElementById('edit-username')
            email = document.getElementById('edit-email')
            const enabled = document.getElementById('edit-user-status');
            body = {
                "username": username.value,
                "attributes":
                    [
                        {"Name": "email", "Value": email.value},
                        {"Name": "enabled", "Value": enabled.value},
                    ]
            }
            break;
        case 'delete-user':
            eventKey = 'delete';
            username = document.getElementById('delete-user-username')
            body = {
                "username": username.value
            }
            break;
        case 'add-sender':
            sender = document.getElementById('sender-email')
            body = {
                "action": "create",
                "item": {
                    "sender": sender.value
                }
            }
            break;
        case 'delete-sender':
            sender = document.getElementById('delete-sender-email')
            body = {
                action: "delete",
                item: {
                    sender: sender.value
                }
            }
            break;

        default:
            console.error("Error: Internal Sever Issue");
            return;
    }

    const url = key.includes('sender') 
    ? 'https://z92sil0zzc.execute-api.ap-south-1.amazonaws.com/default/updateSenderData' 
    :`https://c73n4j6r81.execute-api.ap-south-1.amazonaws.com/default/cognito-users-modification?key=${encodeURIComponent(eventKey)}`;
    try{
        const response = await fetch(url,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if(response.status === 401){
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "login.html";
            return null;
        }
        if(response.status === 400 || response.status === 403){
            const errorData = await response.json();
            throw new Error(errorData.message);
        }
        if(response.status === 500){
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        if(response.status === 200){
            const responseBody = await response.json();
            alert(responseBody.message)
            closeDialog();
            key.includes('sender') ? bodyBuild('senders', await fetchData('senders')) : bodyBuild('users', await fetchData('users'));
            return 200;
        }
    }catch(error){
        alert(error);
        return null;
    }finally{
    }
}

function logout(){
      localStorage.removeItem("id_token");
}

function togglePassword() {
    const toggleBtn = event.target;
    const passwordField = document.getElementById('temp_pass');

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}



function dialogView(key){
    const createUserView = document.getElementById('create-user');
    const addSenderView = document.getElementById('add-sender');
    const editUserView = document.getElementById('edit-user');
    const deleteUserView = document.getElementById('delete-user');
    const deleteSenderView = document.getElementById('delete-sender');




    if(key === 'create-user'){
        createUserView.style.display = 'flex'
        addSenderView.style.display = 'none'

        editUserView.style.display = 'none'
        deleteUserView.style.display = 'none'
        deleteSenderView.style.display = 'none'
    }else if(key === 'add-sender'){
        createUserView.style.display = 'none'
        addSenderView.style.display = 'flex'

        editUserView.style.display = 'none'
        deleteUserView.style.display = 'none'
        deleteSenderView.style.display = 'none'
    }else if(key === 'edit-user'){
        createUserView.style.display = 'none'
        addSenderView.style.display = 'none'
        editUserView.style.display = 'flex'
        deleteUserView.style.display = 'none'
        deleteSenderView.style.display = 'none'
    }else if(key === 'user'){
        createUserView.style.display = 'none'
        addSenderView.style.display = 'none'
        editUserView.style.display = 'none'
        deleteUserView.style.display = 'flex'
        deleteSenderView.style.display = 'none'
    }else if(key === 'sender'){
        createUserView.style.display = 'none'
        addSenderView.style.display = 'none'
        editUserView.style.display = 'none'
        deleteUserView.style.display = 'none'
        deleteSenderView.style.display = 'flex'
    }
    showDialog();
}

function showDialog() {
    const dialog = document.getElementById('edit-dialog');
    const form = document.getElementById('form');
    if (dialog) {
        dialog.showModal();
        dialog.style.visibility = 'visible';
        dialog.style.display = 'flex';
        dialog.addEventListener('cancel', closeDialog);
    }
}

function closeDialog() {
    const dialog = document.getElementById('edit-dialog');

    if (dialog && dialog.open) {
        dialog.style.visibility = 'collapse';
        dialog.style.display = 'none';
        dialog.close();
        dialog.removeEventListener('cancel', closeDialog);

        document
        .querySelectorAll('#edit-dialog input')
        .forEach(input => input.value = '');
    }

}

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

function isEmpty() {
  
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = sendersData.length === 0 ? 'block' : 'none';

}

async function fetchData(key) {
    try {
       if(key==='users'){
        return await fetchCognitoUsers();
       }else if(key==='senders'){
            sendersData = [];
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

function clickEvent(element,key,dataItem){

    
    if(key === 'sender'){
        element.addEventListener('click', function click(){
             dialogView(key)
            const email = document.getElementById('delete-sender-email');
            email.value = dataItem;
        })
       return;
    }

    element.addEventListener('change',  function click(){
        const value = element.value;
        switch (value){
            case 'edit':
                dialogView(key)
                document.querySelectorAll('input').forEach(input => {
                    if (input.offsetParent !== null && !input.disabled) {  // input is visible
                        input.setAttribute('required', 'true');
                    } else {
                        input.removeAttribute('required');
                    }
                });

                if(key === 'edit-user'){
                    const username = document.getElementById('edit-username');
                    const email = document.getElementById('edit-email');
                    const selectOption = document.getElementById('edit-user-status');
                    username.value = dataItem.username;
                    email.value = dataItem.email;
                    selectOption.value = dataItem.enabled ? 'true' : 'false';

                }else if(key === 'edit-sender'){
                    const email = document.getElementById('edit-sender-email');
                    email.value = dataItem;
                }
                break;
            case 'delete':
                const newKey = element.getAttribute('key');
                dialogView(newKey)
                if(newKey === 'user'){
                    const username = document.getElementById('delete-user-username');
                    const email = document.getElementById('delete-user-email');
                    username.value = dataItem.username;
                    email.value = dataItem.email;
                }
            default:
                break;
        }
        element.selectedIndex = 0;
        
    });
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
                <td>
                    <div class="custom-select-wrapper">
                        <select class="custom-select" key='user'>
                            <option value="" disabled selected hidden></option>
                            <option value="edit">Edit</option>
                            <option value="delete">Delete</option>
                        </select>
                        <span class="custom-arrow">&#9662;</span>
                    </div>
                </td>
            `;
            const element = tr.querySelector('.custom-select')
            clickEvent(element,'edit-user',data[i]);
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
                <td>
                    <i class="fa-solid fa-trash custom-select" key='sender'></i>
                </td>
            `;
            const element = tr.querySelector('.custom-select')
            clickEvent(element,'sender',data[i]);
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
            }
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