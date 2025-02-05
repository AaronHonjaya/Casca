const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { runPythonScript } = require("../utils/run_python");
const { parseCSV } = require("../utils/csv_to_json");
const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.array('files'), async (req, res) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
    }
    
    // Create a directory to store PDF files
    const pdfDirectory = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDirectory)) {
        fs.mkdirSync(pdfDirectory);
    }

    // Move uploaded files to the pdfs directory
    const savedFiles = [];
    req.files.forEach((file) => {
        const originalExt = path.extname(file.originalname);
        if (originalExt.toLowerCase() !== '.pdf') {
            return res.status(400).json({ message: 'Only PDF files are allowed.' });
        }

        const newFileName = file.originalname;
        const destination = path.join(pdfDirectory, newFileName);

        fs.renameSync(file.path, destination);
        savedFiles.push(destination);
    });

    // Run the Python script to process the PDF files
    try {
        const currencies = await runPythonScript('./python/process_pdf.py', [...savedFiles]);

        const csvObjs = req.files.reduce((acc, file) => {
            folderName = path.parse(file.originalname).name;
            acc[folderName] = parseCSV(path.join(__dirname, "../csv", folderName));
            return acc;
        }, {});

        // fs.writeFileSync(path.join(__dirname, '../logs/testing.json'), JSON.stringify(csvObjs, null, 4));

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

module.exports = router;
