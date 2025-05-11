let filteredData = [];
let actualData = [];
let tooltip;
let token;
let session_threat_data;


document.addEventListener("DOMContentLoaded", async () => {

  //Creating a slight delay so that race condition doesn't occur with token exchange
    sessionStorage.removeItem('threat_data');
    await exchangeCodeForToken();
    token = localStorage.getItem("id_token");

  //If token doesn't exist, hence no authentication then return to login page 

    if (!token) {

        alert("Not logged in. Redirecting to login...");
        window.location.href = "login.html"; 
      }
    
      
    const table = document.getElementById('threats-table');
    const tbody = table.querySelector('tbody');
    const search_input = document.querySelector('.search-input');
    const dateHeader = document.getElementById('date');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const allBtn = document.getElementById('allBtn');
    const logout = document.querySelector('.logout');

    tooltip = document.getElementById('tooltip');

    const main_threat = document.getElementById("threats");
    const main_threat_data = document.getElementById("threat-data");
    const returnBtn = document.querySelector(".returnBtn");
    const isActiveBtn = document.querySelectorAll(".isActiveBtn > *");
    const data_from = document.getElementById("data_from");
    const data_subject = document.getElementById("data_subject");
    const data_date = document.getElementById("data_date");
    const data_campaign = document.getElementById("data_campaign");
    const data_level = document.getElementById("data_level"); 
    const data_summary = document.getElementById("data_summary");
    const data_ip = document.getElementById("data_ip");
    const data_remark = document.getElementById("data_remark");
    const isActiveText = document.getElementById("isActiveText");


    actualData = await fetchCompleteData();

    filteredData = [...actualData];


    //Return button functionality
    returnBtn.addEventListener('click', function(){

        //Remove data history
        sessionStorage.removeItem('threat_data');
        
        //Remove id from url for any functionality
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        window.history.pushState({}, '', url);

        //Change views with transition

        showLayout(main_threat_data, main_threat);


    });

    isActiveBtn.forEach(btn => {
    btn.addEventListener('click', function() {
        console.log("Is Active:", this.textContent);
        });
    });


    
  //Remove token for user and move to login page

    logout.addEventListener('click', function(){
      localStorage.removeItem("id_token");
    })

    actualData.sort(function(a, b) {
    // Convert date strings to Date objects and compare
    return new Date(b.date) - new Date(a.date);
});



  async function exchangeCodeForToken() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (!code) { return;} // No code in URL, skip

      const clientId = "5nbt5f1u6on96i5ad9693ct9eq";
      const redirectUri = "http://localhost:5500/index.html";
      const tokenEndpoint = "https://ap-south-1sujyelylr.auth.ap-south-1.amazoncognito.com/oauth2/token";

      const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri
      });

      try {
        const response = await fetch(tokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body.toString()
        });

        const data = await response.json();

        if (data.id_token) {
          // Store the token and redirect or show app content
          localStorage.setItem("id_token", data.id_token);
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log("Login successful!");
          // Optionally remove ?code from URL
          window.history.replaceState({}, document.title, redirectUri);
        } else {
          console.error("Token exchange failed:", data);
          alert("Login failed.");
        }
      } catch (err) {
        console.error("Error during token exchange:", err);
      }
    }
    
    // Build the initial table body using the full dataset.
    bodyBuild(tbody, actualData);
    
    // Listen for search input and filter the table.
    search_input.addEventListener('keyup', async function () {
      const value = this.value;
      console.log('Value:', value);
      const searchData = await searchTable(value, filteredData);
      bodyBuild(tbody, searchData);
    });


    // Datewise ordering
    dateHeader.addEventListener('click', async function () {

        let order = this.getAttribute('data-order');
         
        if (!filteredData || filteredData.length === 0) {
            filteredData = actualData;
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
        bodyBuild(tbody, filteredData.length==0 ? actualData : filteredData);
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
          actualData = await fetchCompleteData();
          filteredData = [...actualData];

          // Set the "All" button as active and rebuild the table
          allBtn.classList.add('active');
          bodyBuild(tbody, actualData);
        }else {
          // Remove "All" button's active class if it was active
          if (allBtn.classList.contains('active')) {
            allBtn.classList.remove('active');
          }

          // Add active class to the clicked filter button
          this.classList.add('active');

          // Handle filter based on the selected type
          handleFilter(tbody, type, actualData);
      }
     });
    });



  });


  //Function for displaying tooltip
  async function isEmpty(tbody) {
  
    tooltip.style.display = tbody.rows.length === 0 ? 'block' : 'none';

  }

  //Function for filtering by threat level
  async function handleFilter(tbody, type, data) {

    const activeTypes = Array.from(document.querySelectorAll('.filter-btn.active'))
    .map(btn => btn.getAttribute('data-type').toLowerCase())
    .filter(type => type !== 'all');

    if (activeTypes.length === 0) {
      // If "All" is active or nothing else is active, show full data
      filteredData = data;
    } else {
      // Filter based on selected types
      filteredData = data.filter(item => activeTypes.includes(item.type.toLowerCase()));
    }

    bodyBuild(tbody, filteredData);
  }



  //Function for searching senders
  async function searchTable(value, data) {
    // Searching through the table for levels of threat
    const searchData = [];
    const lowerValue = value.toLowerCase();
    for (let i = 0; i < data.length; i++) {
      const email = data[i].from.toLowerCase();
      if (email.includes(lowerValue)) {
        searchData.push(data[i]);
      }
    }
    return searchData;
  }
  


  //Function for building table body, row click functionality and not destroying structure
  async function bodyBuild(tbody, data) {
    tbody.innerHTML = ''; // Clear old rows
    for (let i = 0; i < data.length; i++) {
      const tr = document.createElement('tr');
  
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${data[i].from}</td>
        <td>${data[i].campaign}</td>
        <td>${data[i].type}</td>
        <td>${data[i].isActive}</td>
        <td>${data[i].date}</td>
      `;
  
      // Add a click event for the row
      tr.addEventListener('click', () => {

        //Moving data into url for data page access
        const id = data[i].emailUid;
        main_threat = document.getElementById("threats");
        main_threat_data = document.getElementById("threat-data");

        session_threat_data = data[i];
        console.log('Row clicked:',id);
        
        const url = new URL(window.location.href);
        url.searchParams.set('id', id);
        window.history.pushState({}, '', url);

        //Change views with transition
        showLayout(main_threat, main_threat_data);
        addDataView(session_threat_data);
  

        
      });
  
      tbody.appendChild(tr);
    }
  
    isEmpty(tbody);
}

async function showLayout(activeLayout, newActiveLayout) {
  // Prepare the new layout (make it visible and animatable)
  newActiveLayout.style.display = 'block'; 
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

async function addDataView(params) {
  
  if(params){
   
    console.log(params)
    data_from.textContent = params.from;
    data_subject.textContent = params.subject;
    data_date.textContent = params.date;
    data_campaign.textContent = params.campaign;
    data_level.textContent = params.type;
    data_summary.textContent = params.summary ? params.summary : "Not Available";
    data_ip.textContent = '';
    data_remark.textContent = '';
    if(params.suspect_ip){
      const list = params.suspect_ip.split(',');
      list.forEach(ip => {
        data_ip.innerHTML += `<li>${ip}</li>`;
      })
    }else{
      data_ip.innerHTML = `<li>Not Available</li>`;
    }
    
    if(params.remarks){
      const list = params.remarks.split('$$$');
      list.forEach(remark => {
        data_remark.innerHTML += `<li>${remark}</li>`;
      })
    }else{
      data_remark.innerHTML = `<li>Not Available</li>`;
    }

    if(!params.isActive){
      isActiveText.textContent = 'Mark active';
    }

    
  }

}
  

  //Fetch complete data from dynamoDB
  async function fetchCompleteData() {

    const body = document.querySelector("tbody");
    const url = 'https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo';

    try {
      
      //Fetching data only via auth. users
      const token = localStorage.getItem("id_token");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": token
        }
      });

      //If login not proper
      if (response.status === 401) {
          alert("Session expired. Please login again.");
          localStorage.clear();
          window.location.href = "login.html";
      }

      let data = await response.json();

      if(data && Array.isArray(data) && data.length> 0){
        
        const unwrappedData = data.map(item => {
          const formattedDate = new Date(item.date.S).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
          hour12: true
        });
        return {
          from: item.from.S,
          date: formattedDate,
          campaign: item.campaign.S,  
          emailUid: item.emailUid.S,
          isActive: item.isActive.S === 'true',  // Convert to boolean
          s3Key: item.s3Key.S,
          subject: item.subject.S,
          summary: item.summary.S,
          suspect_ip: item.suspect_ip.S,
          type: item.type.S
        };
      });

      //Loading Data Animation
      body.classList.remove('skeleton');
    
      return unwrappedData;
      
      } else {
      console.error("Expected 'Items' array but got:", data);
      throw new Error('Something went wrong');  // Return an empty array in case of unexpected format
    }

    } catch (error) {
      
      console.log(`Error : ${error}`);
      return [];
    }finally{
      bodyBuild(body,filteredData);
      console.log("DATA FETCHED!!!!!!!")
    }
    
  }