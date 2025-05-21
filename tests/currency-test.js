// Test script to check available currencies
const axios = require('axios');

async function checkAvailableCurrencies() {
  try {
    // Make a request to get USD exchange rates (which will return all supported currencies)
    const response = await axios.get(
      'https://v6.exchangerate-api.com/v6/9838701d1a0e37099c35ac07/latest/USD'
    );
    
    const data = response.data;
    
    if (data.result === "success") {
      const currencies = Object.keys(data.conversion_rates);
      console.log(`Total supported currencies: ${currencies.length}`);
      console.log('List of supported currencies:');
      console.log(currencies.join(', '));
    } else {
      console.error('API request failed:', data["error-type"]);
    }
  } catch (error) {
    console.error('Error fetching currencies:', error.message);
  }
}

// Run the test
checkAvailableCurrencies();
