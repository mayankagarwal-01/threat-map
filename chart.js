document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
  
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
          label: 'Threats',
          data: [12, 19, 3, 5, 2, 3],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Severity Chart'
          }
        }
      }
    });
  });
  