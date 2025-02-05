const EXCHANGE_RATE_FILE_PATH = require("./utils/updateExchangeRates");
const { parseCSV } = require("./utils/csv_to_json");
const { runPythonScript } = require("./run_python");
const clearFolder = require("./utils/clearfolder");
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeTable } = require("./analyzeTable");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// clearFolder(path.join("./pdfs"));

app.post('/upload', upload.array('files'), async (req, res) => {
    clearFolder(path.join("./pdfs"));

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
    }

    const pdfDirectory = path.join(__dirname, 'pdfs');
    if (!fs.existsSync(pdfDirectory)) {
        fs.mkdirSync(pdfDirectory);
    }

    const savedFiles = [];

    req.files.forEach((file) => {
        const originalExt = path.extname(file.originalname);
        if (originalExt.toLowerCase() !== '.pdf') {
            return res.status(400).json({ message: 'Only PDF files are allowed.' });
        }

        const newFileName = file.originalname;
        const destination = path.join(pdfDirectory, newFileName);
      
        // Move the file to the desired location
        fs.renameSync(file.path, destination);
        savedFiles.push(destination);
    });

    console.log(EXCHANGE_RATE_FILE_PATH)
    console.log(typeof EXCHANGE_RATE_FILE_PATH)
    try {
        const currencies = await runPythonScript('./python/process_pdf.py', [EXCHANGE_RATE_FILE_PATH, ...savedFiles]);

        const csvObjs = req.files.reduce((acc, file) => {
            folderName = path.parse(file.originalname).name;
            acc[folderName] = parseCSV(path.join(__dirname, "csv", folderName))
            return acc;
        }, {}); 
        
    
        fs.writeFileSync(path.join(__dirname, 'logs/testing.json'), JSON.stringify(csvObjs, null, 4));
        
        console.log(currencies);
        res.json({
            message: 'Files uploaded and saved successfully.',
            files: savedFiles,
            tables: csvObjs,
            currencies: currencies
        });

    } catch (error) {
        return res.status(500).json({ message: 'Error processing PDF files.' });
    }
    
    
    
});


app.post('/analyze', (req, res) => {
    const tables = req.body.tables;
    const currencies = req.body.currencies;
    const usdExchangeRates = JSON.parse(fs.readFileSync(EXCHANGE_RATE_FILE_PATH))['conversion_rates'];
    // console.log(tables);
    fs.writeFileSync(path.join(__dirname, 'logs/testingAnalyzeUpdate.json'), JSON.stringify(tables, null, 4));
    
    const analysisResults = {};
    for (const fileName of Object.keys(tables)) {
        console.log(fileName);
        analysisResults[fileName] = {};
        for (const table of Object.keys(tables[fileName])) {
            // console.log(table);
            
            console.log(currencies[fileName]);
            analysisResults[fileName][table] = analyzeTable(tables[fileName][table], currencies[fileName], usdExchangeRates);
        }
    }

    const response = {
        message: 'Tables analyzed successfully.',
        results:  analysisResults
    };
    res.json(response);
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



const shutdown = () => {
    console.log("Shutting down server...");
    if (server) {
        server.close(() => {
            console.log("Server closed.");
            process.exit(0);
        });
    }
};

// Handle signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
