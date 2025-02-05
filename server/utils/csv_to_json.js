
const fs = require("fs");
const path = require("path");

// Function to parse all CSV files in a directory to JSON
function parseCSV(dirPath) {
    // console.log(dirPath)
    
    return fs.readdirSync(dirPath).reduce((acc, file, tableNum) => {
        
        const filePath = path.join(dirPath, file);
        const csvString = fs.readFileSync(filePath, "utf-8");

        const rows = csvString.trim().split("\r");
        const headers = rows.shift().split("\t");

        // console.log(headers)
        // console.log(rows)
        const obj = rows.map(row => {    
            const values = row.split("\t");
            // console.log(values)
            return headers.reduce((acc, header, index) => {
                let value = values[index] ? values[index].trim() : ""; // Handle missing values

                // Convert numbers automatically
                if (!isNaN(value) && value !== "") {
                    value = Number(value);
                }

                acc[header.trim()] = value;
                return acc;
            }, {});
        });
        // console.log(obj)
        acc[`T${tableNum+1}`] = obj;
        return acc;
    }, {});
   
}



module.exports = { parseCSV };




