const express = require('express');
const fs = require('fs');
const path = require('path');
const { analyzeTable } = require("../utils/analyzeTable");
const EXCHANGE_RATE_FILE_PATH = require("../utils/updateExchangeRates");

const router = express.Router();

router.post('/', (req, res) => {
    const tables = req.body.tables;
    const currencies = req.body.currencies;
    const usdExchangeRates = JSON.parse(fs.readFileSync(EXCHANGE_RATE_FILE_PATH))['conversion_rates'];
    console.log(currencies);
    console.log(usdExchangeRates);
    console.log(tables);
    fs.writeFileSync(path.join(__dirname, '../logs/testingAnalyzeUpdate.json'), JSON.stringify(tables, null, 4));
    const analysisResults = {};
    for (const fileName of Object.keys(tables)) {
        // console.log(fileName);
        analysisResults[fileName] = {};
        for (const table of Object.keys(tables[fileName])) {
            analysisResults[fileName][table] = analyzeTable(tables[fileName][table], currencies[fileName], usdExchangeRates);
        }
    }

    const response = {
        message: 'Tables analyzed successfully.',
        results: analysisResults
    };
    return res.json(response);
});



// app.post('/analyze', (req, res) => {
//     const tables = req.body.tables;
//     const currencies = req.body.currencies;
//     const usdExchangeRates = JSON.parse(fs.readFileSync(EXCHANGE_RATE_FILE_PATH))['conversion_rates'];
//     // console.log(tables);
//     fs.writeFileSync(path.join(__dirname, 'logs/testingAnalyzeUpdate.json'), JSON.stringify(tables, null, 4));
    
//     const analysisResults = {};
//     for (const fileName of Object.keys(tables)) {
//         console.log(fileName);
//         analysisResults[fileName] = {};
//         for (const table of Object.keys(tables[fileName])) {
//             // console.log(table);
//             console.log(table)
//             analysisResults[fileName][table] = analyzeTable(tables[fileName][table], currencies[fileName], usdExchangeRates);
//         }
//     }

//     const response = {
//         message: 'Tables analyzed successfully.',
//         results:  analysisResults
//     };
//     res.json(response);
// });
module.exports = router;
