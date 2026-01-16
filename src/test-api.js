// Test API connection from frontend
fetch('http://localhost:5000/api/responses')
  .then(response => response.json())
  .then(data => {
    console.log('Backend response:', data);
    if (data.success) {
      console.log(`Got ${data.data.length} rows from Google Sheets`);
    } else {
      console.error('Error:', data.error);
    }
  })
  .catch(error => console.error('Fetch error:', error));