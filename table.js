let filteredData;
let actualData;
let tooltip;

document.addEventListener("DOMContentLoaded", async () => {
    const table = document.getElementById('threats-table');
    const tbody = table.querySelector('tbody');
    const search_input = document.querySelector('.search-input');
    const dateHeader = document.getElementById('date');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const allBtn = document.getElementById('allBtn');
    tooltip = document.getElementById('tooltip');

    actualData = await fetchData();

    filteredData = actualData;


    actualData.sort(function(a, b) {
    // Convert date strings to Date objects and compare
    return new Date(b.date) - new Date(a.date);
});
    
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
        console.log('Row clicked:', data[i]);
        // You can also show a modal, copy to clipboard, etc. here
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
      
      const response = await fetch(url);
      let data = await response.json();

      if(data && Array.isArray(data) && data.length> 0){
        const unwrappedData = data.map(item => {
        return {
          subject: item.subject.S,
          isActive: item.isActive.S === 'true',  // Convert to boolean
          date: item.date.S,  // It's already a string, no conversion needed
          from: item.from.S,
          campaign: item.campaign.S,
          type: item.type.S,  // Assuming 'type' is present
        };
      });

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