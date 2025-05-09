let filteredData;
let actualData;
let tooltip;
let token;

document.addEventListener("DOMContentLoaded", async () => {

  //Creating a slight delay so that race condition doesn't occur with token exchange
    await exchangeCodeForToken();
    token = await sessionStorage.getItem("id_token");

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

    actualData = await fetchData();

    filteredData = actualData;

  //Remove token for user and move to login page

    logout.addEventListener('click', function(){
      sessionStorage.removeItem("id_token");
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
          sessionStorage.setItem("id_token", data.id_token);
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
            date.innerHTML = 'Date &#8593;';
            
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
            date.innerHTML = 'Date &#8595';
            
        }
        bodyBuild(tbody, filteredData.length==0 ? actualData : filteredData);
    });

    // Filter by threat level
    filterBtns.forEach(button => {
      button.addEventListener('click', async function() {
      const type = this.getAttribute('data-type');
      if (this.classList.contains('active')) {
        return;
      }

      // When the "All" button is clicked
      if (type === 'all') {
          // Remove active class from all buttons
          filterBtns.forEach(btn => {
            btn.classList.remove('active');
          });

          // Fetch the actual data only once when the "All" button is clicked
          actualData = await fetchData();
          filteredData = actualData;

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

    if(tbody.innerHTML === ''){
      tooltip.style.display = 'block';
    }else{
      tooltip.style.display = 'none';
    }
  }

  //Function for filtering by threat level
  async function handleFilter(tbody, type, data) {

    const activeTypes = Array.from(document.querySelectorAll('.filter-btn.active'))
    .map(btn => btn.getAttribute('data-type').toLowerCase())
    .filter(type => type !== 'all');

    filteredData;

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
    searchData = [];
    const lowerValue = value.toLowerCase();
    for (let i = 0; i < data.length; i++) {
      const email = data[i].from.toLowerCase();
      if (email.includes(lowerValue)) {
        searchData.push(data[i]);
      }
    }
    return searchData;
  }
  

  //Function for building table body and not destroying structure

  // function bodyBuild(tbody, data) {
  //   tbody.innerHTML = ''; // Clear old rows
  //   for (let i = 0; i < data.length; i++) {
  //     const row = `
  //       <tr>
  //         <td>${i + 1}</td>
  //         <td>${data[i].from}</td>
  //         <td>${data[i].campaign}</td>
  //         <td>${data[i].type}</td>
  //         <td>${data[i].isActive}</td>
  //         <td>${data[i].date}</td>
  //       </tr>
  //     `;
  //     tbody.innerHTML += row;


  //   }
  //   isEmpty(tbody);
  // }
  

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
        console.log('Row clicked:', data[i].emailUid);
        const id = data[i].emailUid;
        window.location.href = `data.html?id=${id}`;;
      });
  
      tbody.appendChild(tr);
    }
  
    isEmpty(tbody);
  }
  

  //Fetch data from dynamoDB
  async function fetchData() {

    const body = document.querySelector("tbody");
    const url = 'https://u4v38tzuud.execute-api.ap-south-1.amazonaws.com/fetchFromDynamo';

    try {
      
      //Fetching data only via auth. users
      const token = sessionStorage.getItem("id_token");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": token
        }
      });

      //If login not proper
      if (response.status === 401) {
          alert("Session expired. Please login again.");
          window.location.href = "login.html";
      }

      let data = await response.json();

      if(data && Array.isArray(data) && data.length> 0){
        
        const unwrappedData = data.map(item => {
        return {
          emailUid: item.emailUid.S,
          subject: item.subject.S,
          isActive: item.isActive.S === 'true',  // Convert to boolean
          date: item.date.S,  // It's already a string, no conversion needed
          from: item.from.S,
          campaign: item.campaign.S,
          type: item.type.S,  // Assuming 'type' is present
        };
      });

      //Loading Data Animation
      if(unwrappedData){
        body.classList.remove('skeleton');
      }else{
        body.classList.add('skeleton');

      }
    
      return unwrappedData;
      
      } else {
      console.error("Expected 'Items' array but got:", data);
      throw new Error('Something went wrong');  // Return an empty array in case of unexpected format
    }

    } catch (error) {
      
      console.log(`Error : ${error}`);
      return [];
    }
    
  }