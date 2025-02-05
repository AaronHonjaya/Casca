const fs = require('fs');
const path = require('path'); 
require('dotenv').config();

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const EXCHANGE_RATE_FILE_PATH = path.join(__dirname, '../exchangeRates/exchange_rates.json');
async function updateExchangeRates() {

    // Check if exchange rates file exists
    let timeDiff = Infinity;
    if (fs.existsSync(EXCHANGE_RATE_FILE_PATH)) {
        const prevExchRates = JSON.parse(fs.readFileSync(EXCHANGE_RATE_FILE_PATH, 'utf-8'));
        const currentUnixTime = Math.floor(Date.now() / 1000);
        timeDiff = currentUnixTime - prevExchRates.timestamp;
    }
    

    // Fetch exchange rates if file doesn't exist or if it's older than 1 hour
    if (timeDiff >= 3600){
        console.log("Fetching exchange rates...");
        const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const currentUnixTime = Math.floor(Date.now() / 1000);

            fs.writeFileSync(EXCHANGE_RATE_FILE_PATH, JSON.stringify({conversion_rates: data.conversion_rates, timestamp: currentUnixTime}));
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
        }
    }else{
        console.log("Exchange rates are up to date");
    }
}

// keep calling the function every hour
updateExchangeRates();
setInterval(updateExchangeRates, 3600000);

module.exports = EXCHANGE_RATE_FILE_PATH;
