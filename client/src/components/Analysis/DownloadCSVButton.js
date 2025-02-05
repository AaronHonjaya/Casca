import React from "react";
import Papa from "papaparse";
export const DownloadCSVButton = ({ data, name }) => {

  if (typeof name !== "string" || name === "") {
    name = "analysis.csv";
  }

  if (!data || data.length === 0) {
    return null;
  }


  if (typeof data === "object") {
    data = Object.entries(data).map(([key, value]) => 
      ({
        'date': key, 
        ...value
      })
    )
  }
  
  
  if(!Array.isArray(data) || typeof data !== "object") {
    return null;
  }

  
  const handleDownload = () => {
    const csv = Papa.unparse(data); 
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.style.display = 'none';  
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleDownload}>Download CSV</button>;
};
