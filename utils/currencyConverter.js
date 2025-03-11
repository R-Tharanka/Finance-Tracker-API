const axios = require("axios");

// Fetch exchange rates using the correct property name
async function fetchExchangeRate(fromCurrency, toCurrency = "USD") {
  try {
    // The API returns conversion data in "conversion_rates"
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/9838701d1a0e37099c35ac07/latest/${fromCurrency}`
    );
    // Use conversion_rates instead of rates
    return response.data.conversion_rates[toCurrency] || 1;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 1; // Default to 1:1 conversion if API fails
  }
}

// Convert an amount from one currency to another
async function convertCurrency(amount, fromCurrency, toCurrency = "USD") {
  const exchangeRate = await fetchExchangeRate(fromCurrency, toCurrency);
  return { convertedAmount: amount * exchangeRate, exchangeRate };
}

module.exports = { fetchExchangeRate, convertCurrency };
