// File: src/components/FileUpload/FileUpload.jsx
import React, { useState } from 'react';
import { uploadFiles, analyzeTablesRequest } from './api';
import { UploadForm } from './UploadForm';
import { TablesDisplay } from './TablesDisplay';
import { AnalysisResults } from './AnalysisResultsDisplay';

export const Analysis = () => {
  const [files, setFiles] = useState(null);
  const [response, setResponse] = useState(null);
  const [parsedTables, setParsedTables] = useState({});
  const [currencies, setCurrencies] = useState({});
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isUploading, setIsUploading] = useState(false);  // New state for tracking upload status
  const [isError, setIsError] = useState(false);  // New state for tracking error status
  // Handle file selection
  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setParsedTables({});
    setAnalysisResults(null);

    if (!files || files.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    setIsUploading(true);
    setIsError(false);
    try {
      const res = await uploadFiles(formData);
      setResponse(res);
      setIsUploading(false);
      console.log("Server Response:", res);

      if (res.tables) {
        setParsedTables(res.tables);
      }
      if (res.currencies) {
        setCurrencies(res.currencies);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setResponse({ message: 'Error uploading files.' });
      setIsError(true);
      setIsUploading(false);
    }
  };

  // Function to update table state for a specific file
  const updateTable = (fileName, tableId, updatedData) => {
    setParsedTables((prevTables) => ({
      ...prevTables,
      [fileName]: {
        ...prevTables[fileName],
        [tableId]: updatedData,
      },
    }));
  };

  // Delete a specific table
  const deleteTable = (fileName, tableId) => {
    setParsedTables((prevTables) => {
      const updatedTables = { ...prevTables[fileName] };
      delete updatedTables[tableId];
      return {
        ...prevTables,
        [fileName]: updatedTables,
      };
    });
  };

  // Handle currency change for a file
  const handleCurrencyChange = (fileName, currency) => {
    setCurrencies((prevCurrencies) => ({
      ...prevCurrencies,
      [fileName]: currency
    }));
  };

  // Trigger analyze request
  const handleAnalyzeTables = async () => {
    try {
      console.log("parsedTables:", parsedTables);
      const analysisResult = await analyzeTablesRequest(parsedTables, currencies);
      console.log("Analyze Result:", analysisResult);
      setAnalysisResults(analysisResult.results);
    } catch (error) {
      console.error("Error analyzing tables:", error);
    }
  };

  return (
    <div> 
      <h1>File Upload</h1>
      {isUploading && <p>Waiting on upload...</p>}  {/* Display message while uploading */}
      {isError && <p>Error uploading files.</p>}  {/* Display error message */}
      <button onClick={() => console.log(parsedTables)}>print tables</button>
      <UploadForm onFileChange={handleFileChange} onSubmit={handleSubmit} />
      <button onClick={handleAnalyzeTables}>Analyze Tables</button>
      <AnalysisResults results={analysisResults} />


      {/* Display uploaded filenames */}

      <TablesDisplay
        parsedTables={parsedTables}
        currencies={currencies}
        onCurrencyChange={handleCurrencyChange}
        onUpdateTable={updateTable}
        onDeleteTable={deleteTable}
        onAnalyze={handleAnalyzeTables}
      />
    </div>
  );
};

