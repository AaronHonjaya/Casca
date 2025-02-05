import React, { useState } from "react";

export const EditableJsonTable = ({ data, title, onDataChange, onDeleteTable }) => {
    // console.log("table: ", data)
    const [headers, setHeaders] = useState(Object.keys(data[0]));
   

    const [headerTypes] = useState(() => {
        console.log("Computing headerTypes only on first render!");
        // Your "compute once" logic here
        return headers.reduce((acc, header) => {
          acc[header] = "string";
          for (const row of data) {
            if (row[header] !== "") {
              acc[header] = typeof row[header];
              break;
            }
          }
          return acc;
        }, {});
      });
    console.log("header types: ", headerTypes);

    if (!data || data.length === 0) {
        return <p>No data available</p>;
    }

    // Extract headers dynamically from the first object in the table
    // const headers = Object.keys(data[0]);
    // Handle row deletion
    

    const handleHeaderChange = (oldHeader, newHeader) => {
        if (!newHeader.trim()) return; // Prevent empty headers

        // Ensure the new header does not already exist
        if (headers.includes(newHeader)) {
            alert("Header name must be unique!");
            return;
        }

        // Update headers state
        const updatedHeaders = headers.map((header) =>
            header === oldHeader ? newHeader : header
        );
        setHeaders(updatedHeaders);

        // Update data to reflect the new headers
        const updatedData = data.map((row) => {
            const newRow = { ...row };
            newRow[newHeader] = newRow[oldHeader]; // Copy data to new key
            delete newRow[oldHeader]; // Remove old key
            return newRow;
        });

        // Notify parent about the change
        onDataChange(updatedData);
    };
    const handleRowDelete = (rowIndex) => {
        const updatedData = data.filter((_, index) => index !== rowIndex);
        onDataChange(updatedData); // Update the parent state
    };

    const handleCellChange = (row, rowIndex, header, newValue, isBlur) => {
        const prevValue = row[header];
        // console.log("typeof prev value", typeof prevValue);
        
        if (isBlur && newValue !== "" && headerTypes[header] === "number") {
        
            newValue = parseFloat(newValue);
            if (isNaN(newValue)){
                alert("Invalid input. Must be a number");
                newValue = 0;
            }
        }

        onDataChange(
            data.map((r, i) =>
                i === rowIndex
                    ? { ...r, [header]: newValue }
                    : r
            )
        )
        
    }

   


    return (
        <div>
            <h3>{title}</h3>
            {headers && !isValidTable(data) && <h3>Table is invalid. Must incldue a Date. Must include a balance column, 
                or alternatively a debit/out column and a credit/in column</h3>}
            <button
                onClick={onDeleteTable}
                style={{
                    marginTop: "3px",
                    backgroundColor: "darkred",
                    color: "white",
                    border: "none",
                    padding: "5px",
                    cursor: "pointer",
                }}
            >
                Delete Entire Table
            </button>
            <table border="1">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index}>
                            <input
                                type="text"
                                value={header}
                                onChange={(e) =>
                                    handleHeaderChange(header, e.target.value)
                                }
                                style={{
                                    width: "100px",
                                    border: "none",
                                    padding: "5px",
                                }}
                            />
                        </th>
                        ))}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map((header, colIndex) => (
                                <td key={colIndex}>
                                    <input
                                        type="text"
                                        value={row[header]}
                                        onChange={(e) =>
                                            
                                            handleCellChange(row, rowIndex, header, e.target.value, false)
                                        }
                                        onBlur={(e) => handleCellChange(row, rowIndex, header, e.target.value, true)}
                                        style={{
                                            width: "100%",
                                            border: "none",
                                            padding: "5px",
                                        }}
                                    />
                                </td>
                            ))}
                            <td>
                                <button
                                    onClick={() => handleRowDelete(rowIndex)}
                                    style={{
                                        backgroundColor: "red",
                                        color: "white",
                                        border: "none",
                                        padding: "5px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Delete Row
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const isValidTable = (data) => {
    
    const lowercaseHeaders = Object.keys(data[0]).map(header => header.toLowerCase());
    console.log(lowercaseHeaders);
    let balance_seen = false;
    let date_seen = false;
    let debit_seen = false;
    let credit_seen = false;
    let in_seen = false;
    let out_seen = false;
    let amount_seen = false;
    let description_index = -1;
    for (const idx in lowercaseHeaders) {
        const header = lowercaseHeaders[idx];
        if (header.includes("balance")) {
            balance_seen = true;
        }
        if (header.includes("date")) {
            date_seen = true;
        }
        if (header.includes("debit")) {
            debit_seen = true;
        }
        if (header.includes("credit")) {
            credit_seen = true;
        }
        if (header.includes(" in ")) {
            in_seen = true;
        }
        if (header.includes(" out ")) {
            out_seen = true;
        }
        if (header.includes("amount")) {
            amount_seen = true;
        }
        if(header.includes("description")){
            description_index = idx;
        }
    }

    if (!date_seen){
        return false;
    }

    
    if (!balance_seen && (!debit_seen || !credit_seen) && (!in_seen || !out_seen)){
        
        if (!amount_seen || description_index === -1){
            return false;
        }else{
            const key = Object.keys(data[0])[description_index];
            console.log("inside is valid table")
            console.log("headers", lowercaseHeaders)
            for (const row of data){
                console.log("description: ", row[key].toLowerCase())
                if (!row[key].toLowerCase().includes("withdrawl") && !row[key].toLowerCase().includes("deposit")){
                    console.log("description: ", row[key].toLowerCase())
                    console.log("contains deposit: ", row[key].toLowerCase().includes("deposit"))
                    console.log("contains withdrawl: ", row[key].toLowerCase().includes("withdrawl"))
                    return false;
                }
            }
        }
    }





    return true;
}
