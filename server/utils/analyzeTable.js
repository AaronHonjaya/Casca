const chrono = require('chrono-node');

const isExactMatch = (header, keyword) => new RegExp(`\\b${keyword}\\b`).test(header);

const strToFloat = (str) => {
    if (str === "") {
        return 0;
    }
    const float = parseFloat(str);
    if (isNaN(float)) {
        return 0;
    }
    return float;
}


const baseToUSD = (amount, base_currency, usdExchangeRates) => {
    return amount / usdExchangeRates[base_currency];
};

const stddev = (arr, mean) => {
    const n = arr.length;
    let sum = 0;
    for (const val of arr){
        sum += Math.pow(val - mean, 2);
    }
    return Math.sqrt(sum / n);
};

function analyzeTable(table, base_currency, usdExchangeRates){
    
    console.log(base_currency);
    console.log(usdExchangeRates[base_currency]);
    const origHeaders = Object.keys(table[0]);
    const lowercaseHeaders = Object.keys(table[0]).map(header => header.toLowerCase());
    console.log(table[0]);
    let date_key = "";
    let debit_key = "";
    let credit_key = "";
    
    // find the keys for date, and in/out cashflow
    for (const idx in lowercaseHeaders) {
        const header = lowercaseHeaders[idx];
        if (isExactMatch(header, "date") && date_key === "") {
            date_key = origHeaders[idx];
        }
        if (isExactMatch(header, "debit") || isExactMatch(header, "out")) {
            debit_key = origHeaders[idx];
        }
        if (isExactMatch(header, "credit") || isExactMatch(header, "in")) {
            credit_key = origHeaders[idx];
        }
    }

    // Map each month to its data
    const dateToData = new Map();
    for (const row of table){
        const date = chrono.parseDate(row[date_key]);
        if (!date){
            console.log("Invalid date");
            break;
        }
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${month}-${year}`;
        if (!dateToData.has(key)){
            dateToData.set(key, {total_debit: 0, total_credit: 0, num_debit_transactions: 0, num_credit_transactions: 0, debitList: []});
        }
        debit_amt = baseToUSD(strToFloat(row[debit_key]), base_currency, usdExchangeRates);
        credit_amt = baseToUSD(strToFloat(row[credit_key]), base_currency, usdExchangeRates);
        entry = dateToData.get(key);
        entry.total_debit = entry.total_debit + debit_amt;
        entry.total_credit = entry.total_credit + credit_amt;

        if (debit_amt > 0){
            entry.num_debit_transactions += 1;
            entry.debitList.push(debit_amt);

        }

        if (credit_amt > 0){
            entry.num_credit_transactions += 1;
            entry.debitList.push(credit_amt);
        }
        dateToData.set(key, entry);
    } 
    
    // calculate the mean and standard deviation for each month
    let total_credit = 0;
    let total_debit = 0;
    for (const [key, value] of dateToData){
        // console.log(key, value);
        total_credit += value.total_credit;
        total_debit += value.total_debit;
        const debit_mean = value.total_debit / value.num_debit_transactions;
        const credit_mean = value.total_credit / value.num_credit_transactions;
        dateToData.set(key, {
            ...dateToData.get(key),
            debit_mean: debit_mean, 
            debit_stddev: stddev(value.debitList, debit_mean), 
            credit_mean: credit_mean,
            credit_stddev: stddev(value.debitList, credit_mean)
        });

        delete dateToData.get(key).debitList;
        delete dateToData.get(key).creditList;
    }
    const dateToDataObj = Object.fromEntries(dateToData);

    const data = {
        avg_monthly_credit: total_credit / dateToData.size,
        avg_monthly_debit: total_debit / dateToData.size,
        num_months: dateToData.size,
        monthly_breakdown: dateToDataObj
    }
    // console.log(data);
// 
    return data;    
}

module.exports = { analyzeTable };