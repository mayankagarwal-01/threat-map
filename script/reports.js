let dialog, reportType, reportType_sender, reportType_activity, reportType_threat;
let reportType_sender_list, reportType_activity_list, reportType_threat_list;
let email_metadata = [];
let required_Metadata = [];
let reportData = [];
let filteredData = [];

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("id_token");

    if (!token) {
        alert("Not logged in. Redirecting to login...");
        window.location.href = "login.html"; 
    }

    email_metadata = await fetchData('TABLE1');
    reportData = await fetchData('TABLE2');
    updateView();
    

    const gen_btn_report = document.getElementById('gen-btn-report');
    gen_btn_report.addEventListener('click', function(){
        showDialog();
    })

    dialog = document.querySelector('dialog');
    const genBtn = document.querySelector('.gen-btn');
    const confirmGen = document.getElementById('confirmGen');
    const cancelGen = document.getElementById('cancelGen');
    const logout = document.querySelector('.logout');
    reportType = document.getElementById('by');
    dateRangeFrom = document.getElementById('from-date');
    dateRangeTo = document.getElementById('upto-date');
    reportType_threat = document.getElementById('threat');
    reportType_sender = document.getElementById('sender');
    reportType_activity = document.getElementById('activity');

    reportType_threat_list = document.getElementById('type-list');
    reportType_sender_list = document.getElementById('sender-list');
    reportType_activity_list = document.getElementById('activity-list');

    const filterBtns = document.querySelectorAll('.filter-btn');
    const dateHeader = document.getElementById('date');
    const table = document.getElementById('reports-table')
    const tbody = table.querySelector('tbody');


    logout.addEventListener('click', function(){
      localStorage.removeItem("id_token");
    })
    // Datewise ordering
    dateHeader.addEventListener('click', async function () {

        let order = this.getAttribute('data-order');
         
        if (!filteredData || filteredData.length === 0) {
            filteredData = reportData;
         }

        if(order == 'asc'){
            this.setAttribute('data-order', 'desc');
            filteredData.sort(function(a, b) {

              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              if (isNaN(dateA) || isNaN(dateB)) {
                return 0;
             }
              return dateB - dateA

              });
              this.innerHTML = 'Date &#8593';
            
        }else{
            this.setAttribute('data-order', 'asc');
            filteredData.sort(function(a, b) {

              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              if (isNaN(dateA) || isNaN(dateB)) {
                return 0;
              }

              return dateA - dateB;
              });
            this.innerHTML = 'Date &#8595';
            
        }
        bodyBuild(tbody, filteredData.length==0 ? reportData : filteredData);
    });

    // Filter by threat level
    filterBtns.forEach(button => {
      button.addEventListener('click', async function() {
      const type = this.getAttribute('data-type');
      

      // When the "All" button is clicked
      if (type === 'all') {
          // Remove active class from all buttons
          filterBtns.forEach(btn => {
            btn.classList.remove('active');
          });

          // Fetch the actual data only once when the "All" button is clicked
          reportData = await fetchData('TABLE2');
          filteredData = [...reportData];

          // Set the "All" button as active and rebuild the table
          allBtn.classList.add('active');
          bodyBuild(tbody, reportData);
        }else {
          // Remove "All" button's active class if it was active
          if (allBtn.classList.contains('active')) {
            allBtn.classList.remove('active');
          }

          // Add active class to the clicked filter button
          this.classList.add('active');

          // Handle filter based on the selected type
          handleFilter(tbody, reportData);
      }
     });
    });

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

        if(email_metadata.length === 0){
            alert('Error : Data could not be fetched!!');
            return;
        }

        const by = reportType.value;
        const sender = reportType_sender_list.value;
        const threat_type = reportType_threat_list.value;
        const activity = reportType_activity_list.value;

        confirmGen.disabled = true;
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

    const filterSelect = document.getElementById('filterSelect');

        // On change of select option
        filterSelect.addEventListener('change', async function () {
        const selectedType = this.value;

        if (selectedType === 'all') {
            // Refetch full data
            if (reportData.length === 0) {
            reportData = await fetchData('TABLE2');
            }
            filteredData = [...reportData];
        } else {
            // Filter based on s3Key prefix
            filteredData = reportData.filter(item =>
            item.s3Key.replace('reports/', '').startsWith(selectedType)
            );
        }

        bodyBuild(tbody, filteredData);
    });

});

function updateView(){
    const table = document.getElementById('reports-table')
    const tbody = table.querySelector('tbody');
    const noReports = document.getElementById('no-reports');
    const reportsView = document.getElementById('all-reports');

    if(reportData.length === 0){
        showLayout(reportsView, noReports);
    }else{
        showLayout(noReports, reportsView);
        bodyBuild(tbody,reportData)
    }
}

function showDialog() {
    if (dialog) {
        dialog.showModal();
        dialog.style.visibility = 'visible';
        dialog.style.display = 'flex';
        reportType.value = 'default'
    }
}

function closeDialog() {
    if (dialog && dialog.open) {
        dialog.style.visibility = 'collapse';
        dialog.style.display = 'none';
        dialog.close();
    }
}

async function handleFilter(table_body, metadata) {
  const selectedType = document.getElementById('filterSelect').value.toLowerCase();

  if (selectedType === 'all') {
    // Show full data
    filteredData = metadata;
  } else {
    // Filter based on selected type
    filteredData = metadata.filter(item =>
      item.s3Key.replace('reports/', '').startsWith(selectedType)
    );
  }

  bodyBuild(table_body, filteredData);
}


//Function for building table body, row click functionality and not destroying structure
async function bodyBuild(tbody, metadata) {
    tbody.innerHTML = ''; // Clear old rows
    for (let i = 0; i < metadata.length; i++) {
      const tr = document.createElement('tr');
  
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${metadata[i].s3Key.replace('reports/','')}</td>
        <td>${metadata[i].date}</td>
        <td><i class="fa-solid fa-download download-btn" style="cursor: pointer" data-index=${i}></i></td>
      `;
      tbody.appendChild(tr);


    }
    tbody.classList.remove('skeleton');

    tbody.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', async(event) => {
      const index = parseInt(event.currentTarget.dataset.index);
      const file = metadata[index].s3Key;
      const button = event.currentTarget;
      button.disabled = true;
      await downloadFile(file); 
      button.disabled = false;
    });
  });
}

async function downloadFile(file){
    const url = 'https://nwzy9don99.execute-api.ap-south-1.amazonaws.com/default/get-pdf-url'
        const token = localStorage.getItem("id_token");

        try {
          const data = await getAuth(`${url}?key=${encodeURIComponent(file)}`, token);
          if(data.presignedUrl){
            window.location.href = data.presignedUrl;
          }
          
        } catch (error) {
          console.log(`Error loading pdf : ${error}`)
        }

}

async function showLayout(activeLayout, newActiveLayout) {
  // Prepare the new layout (make it visible and animatable)
  newActiveLayout.style.display = 'flex'; 
  requestAnimationFrame(() => {
    newActiveLayout.classList.add('active'); // fade in
    activeLayout.classList.remove('active'); // start fade out
  });

  // Wait for the transition to finish on the one being hidden
  return new Promise(resolve => {
    const onTransitionEnd = () => {
      activeLayout.style.display = 'none';
      activeLayout.removeEventListener('transitionend', onTransitionEnd);
      resolve();
    };
    activeLayout.addEventListener('transitionend', onTransitionEnd);
  });
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
    
    required_Metadata = [];

    const confirmGen = document.getElementById('confirmGen');
    if (by === 'default') {
        required_Metadata = email_metadata.filter(item => {
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
        required_Metadata = email_metadata.filter(item => {
            const itemDate = new Date(item.date);
            return (
                item.from === sender &&
                itemDate >= fromDateObj &&
                itemDate <= uptoDateObj
            );
        });
    } else if (by === 'threat') {
        required_Metadata = email_metadata.filter(item => {
            const itemDate = new Date(item.date);
            return (
                item.type === threat_type &&
                itemDate >= fromDateObj &&
                itemDate <= uptoDateObj
            );
        });
    } else {
        required_Metadata = email_metadata.filter(item => {
            const itemDate = new Date(item.date);
            return (
                item.isActive === activity &&
                itemDate >= fromDateObj &&
                itemDate <= uptoDateObj
            );
        });
    }

    if(required_Metadata.length === 0){
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
            body: JSON.stringify(required_Metadata)
        })


        if(response.status === 200){
            alert("Report generated!!");
            closeDialog();

            confirmGen.disabled = false;
            reportData = await fetchData('TABLE2');
            updateView();
        }

    } catch (error) {
        confirmGen.disabled = false;
        alert(`ERROR : ${error}`);
    }

}

async function fetchData(key) {
    const url = `https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo?key=${encodeURIComponent(key)}`;

    try {
        //Fetching data only via auth. users
        const token = localStorage.getItem("id_token");
        const response = await getAuth(url, token);

        if(response && Array.isArray(response) && response.length > 0){
            const unwrappedData = response.map(item => {
                const formattedDate = new Date(item.date.S).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                });

                if(key === 'TABLE2'){
                    

                    return {
                        date: formattedDate,
                        s3Key: item.s3Key.S,
                    };
                    
                }else{
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
                }
            });
            return unwrappedData;
        }
        return [];
    } catch (error) {
        console.log(`Error : ${error}`);
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