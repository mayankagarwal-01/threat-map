let filteredData;

document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById('threats-table');
    const tbody = table.querySelector('tbody');
    const search_input = document.querySelector('.search-input');
    const dateHeader = document.getElementById('date');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const allBtn = document.getElementById('allBtn');

    
    const actualData = [
      {
        "from": "abc@abc.com",
        "campaign": "Spring Sale",
        "type": "Urgent",
        "isActive": true,
        "date": "2025-05-01"
      },
      {
        "from": "def@def.com",
        "campaign": "Product Launch",
        "type": "Medium",
        "isActive": false,
        "date": "2025-04-15"
      },
      {
        "from": "ghi@ghi.com",
        "campaign": "Account Renewal",
        "type": "Urgent",
        "isActive": true,
        "date": "2025-05-07"
      },
      {
        "from": "jkl@jkl.com",
        "campaign": "Security Alert",
        "type": "Low",
        "isActive": true,
        "date": "2025-05-08"
      }
    ];
    filteredData = actualData;

    actualData.sort(function(a, b) {
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
        if(order == 'asc'){
            this.setAttribute('data-order', 'desc');
            filteredData.sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
              });
            date.innerHTML = 'Date &#8593;';
            
        }else{
            this.setAttribute('data-order', 'asc');
            filteredData.sort(function(a, b) {
                return new Date(a.date) - new Date(b.date);
              });
            date.innerHTML = 'Date &#8595';
            
        }
        bodyBuild(tbody, filteredData.length==0 ? actualData : filteredData);
    });

    // Filter by threat level
    filterBtns.forEach(button => {
      button.addEventListener('click', function(){
        const type = this.getAttribute('data-type');
        if (this.classList.contains('active')){
            return;
        };
        if(type === 'all'){
          filterBtns.forEach(btn => {
            btn.classList.remove('active');
            filteredData = actualData;
          });
          allBtn.classList.add('active');
          bodyBuild(tbody, actualData);
        }else{
          if(allBtn.classList.contains('active')){
            allBtn.classList.remove('active');
          }
          this.classList.add('active');
          handleFilter(tbody, type, actualData);

        }
      });
    });


  });


  //Function for displaying tooltip
  async function isEmpty(tbody) {

    const tooltip = document.getElementById('tooltip');
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
  