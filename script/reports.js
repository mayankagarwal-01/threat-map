let dialog, reportType, reportType_sender, reportType_activity, reportType_threat;
let reportType_sender_list, reportType_activity_list, reportType_threat_list;
let data = [];
let requiredData = [];
let reportData = [];

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("id_token");

    if (!token) {
        alert("Not logged in. Redirecting to login...");
        window.location.href = "login.html"; 
    }

    data = await fetchThreatData();

    dialog = document.querySelector('dialog');
    const genBtn = document.querySelector('.gen-btn');
    const confirmGen = document.getElementById('confirmGen');
    const cancelGen = document.getElementById('cancelGen');
    reportType = document.getElementById('by');
    dateRangeFrom = document.getElementById('from-date');
    dateRangeTo = document.getElementById('upto-date');
    reportType_threat = document.getElementById('threat');
    reportType_sender = document.getElementById('sender');
    reportType_activity = document.getElementById('activity');

    reportType_threat_list = document.getElementById('type-list');
    reportType_sender_list = document.getElementById('sender-list');
    reportType_activity_list = document.getElementById('activity-list');

    confirmGen.addEventListener('click', function(){
        if(!dateRangeFrom.value || !dateRangeTo.value || !reportType_sender_list.value || !reportType_activity_list.value || !reportType_threat_list.value){
            alert('Select all parameters');
            return;
        }

        const fromDate = dateRangeFrom.value;
        const uptoDate = dateRangeTo.value;
        
        if(fromDate > uptoDate){
            alert('Incorrect date selected!!');
            return;
        }

        if(data.length === 0){
            alert('Error : Data could not be fetched!!');
            return;
        }

        const by = reportType.value;
        const sender = reportType_sender_list.value;
        const threat_type = reportType_threat_list.value;
        const activity = reportType_activity_list.value;

        generateReport(by, sender, threat_type, activity, fromDate, uptoDate);
    });

    reportType.addEventListener("change", () => {
        const value = reportType.value;
        dialogView(value);
    });

    cancelGen.addEventListener('click', function(){
        confirmGen.style.isActive = 'false'
        closeDialog();
    });

    genBtn.addEventListener('click', function(){
        showDialog();
    });

    dialog.addEventListener('cancel', function(){
        closeDialog();
    });
});

function showDialog() {
    if (dialog) {
        dialog.showModal();
        dialog.style.visibility = 'visible';
        reportType.value = 'default'
    }
}

function closeDialog() {
    if (dialog && dialog.open) {
        dialog.style.visibility = 'collapse';
        dialog.close();
    }
}

function dialogView(value){
    if(value === 'default'){
        reportType_sender.style.display = 'flex';
        reportType_threat.style.display = 'flex';
        reportType_activity.style.display = 'flex';
    }else if(value === 'sender'){
        reportType_sender.style.display = 'flex';
        reportType_threat.style.display = 'none';
        reportType_activity.style.display = 'none';
    }else if(value === 'threat'){
        reportType_sender.style.display = 'none';
        reportType_threat.style.display = 'flex';
        reportType_activity.style.display = 'none';
    }else{
        reportType_sender.style.display = 'none';
        reportType_threat.style.display = 'none';
        reportType_activity.style.display = 'flex';
    }
}

async function generateReport(by, sender, threat_type, activity, fromDate, uptoDate){
    // Create Date objects from the input strings
    const fromDateObj = new Date(fromDate);
    const uptoDateObj = new Date(uptoDate);
    
    requiredData = [];

    if (by === 'default') {
        requiredData = data.filter(item => {
            // Parse the item date string to a Date object for comparison
            const itemDate = new Date(item.date);
            return (
                item.from === sender &&
                item.type === threat_type &&
                item.isActive === activity &&
                itemDate >= fromDateObj &&
                itemDate <= uptoDateObj
            );
        });
    } else if (by === 'sender') {
        requiredData = data.filter(item => {
            const itemDate = new Date(item.date);
            return (
                item.from === sender &&
                itemDate >= fromDateObj &&
                itemDate <= uptoDateObj
            );
        });
    } else if (by === 'threat') {
        requiredData = data.filter(item => {
            const itemDate = new Date(item.date);
            return (
                item.type === threat_type &&
                itemDate >= fromDateObj &&
                itemDate <= uptoDateObj
            );
        });
    } else {
        requiredData = data.filter(item => {
            const itemDate = new Date(item.date);
            return (
                item.isActive === activity &&
                itemDate >= fromDateObj &&
                itemDate <= uptoDateObj
            );
        });
    }

    if(requiredData.length === 0){
        alert('No records found for given parameters');
        return;
    }

    const token = localStorage.getItem("id_token");
    const url = `https://82hslw6sze.execute-api.ap-south-1.amazonaws.com/default/generateReport?id=${encodeURIComponent(by)}`;
    try {
        
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requiredData)
        })

        if(response.status === 200){
            alert("Report generated!!");
            closeDialog();
            reportData = await fetchReportData();
        }

    } catch (error) {
        alert(`ERROR : ${error}`);
    }

}

async function fetchReportData() {
    const key = 'TABLE2'
    const url = `https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo?key=${encodeURIComponent(key)}`;

    try {
        //Fetching data only via auth. users
        const token = localStorage.getItem("id_token");
        const data = await getAuth(url, token);

        if(data && Array.isArray(data) && data.length > 0){
            const unwrappedData = data.map(item => {
                const formattedDate = new Date(item.date.S).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    hour12: true
                });

                return {
                    date: formattedDate,
                    s3Key: item.s3Key.S,
                };
            });
            return unwrappedData;
        } else {
            console.error("Expected 'Items' array but got:", data);
            throw new Error('Something went wrong');
        }
    } catch (error) {
        console.log(`Error : ${error}`);
        return [];
    } finally {  
        console.log("REPORT DATA FETCHED!!!!!!!")
    }
}

//Fetch complete data from dynamoDB
async function fetchThreatData() {
    const key = 'TABLE1'
    const url = `https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo?key=${encodeURIComponent(key)}`;

    try {
        //Fetching data only via auth. users
        const token = localStorage.getItem("id_token");
        const data = await getAuth(url, token);

        if(data && Array.isArray(data) && data.length > 0){
            const unwrappedData = data.map(item => {
                const formattedDate = new Date(item.date.S).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    hour12: true
                });

                return {
                    from: item.from.S,
                    date: formattedDate,
                    campaign: item.campaign.S,  
                    emailUid: item.emailUid.S,
                    isActive: item.isActive.S,
                    s3Key: item.s3Key.S,
                    subject: item.subject.S,
                    summary: item.summary.S,
                    suspect_ip: item.suspect_ip.S,
                    type: item.type.S,
                    remarks: item.remarks.S ?? 'N/A'
                };
            });
            return unwrappedData;
        } else {
            console.error("Expected 'Items' array but got:", data);
            throw new Error('Something went wrong');
        }
    } catch (error) {
        console.log(`Error : ${error}`);
        return [];
    } finally {  
        console.log("DATA FETCHED!!!!!!!")
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

        //If login not proper
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