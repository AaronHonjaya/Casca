// File: src/components/FileUpload/TablesDisplay.jsx
import React from 'react';
import { EditableJsonTable } from '../EditableJsonTable';
import { CurrencyDropdown } from '../CurrencyDropdown';

export const TablesDisplay = ({
  parsedTables,
  currencies,
  onCurrencyChange,
  onUpdateTable,
  onDeleteTable,
}) => {
  if (!parsedTables || Object.keys(parsedTables).length === 0) {
    return null; // or a friendly message
  }

  return (
    <div>
      {Object.keys(parsedTables).map((fileName, fileIndex) => (
        <div key={fileIndex}>
          <h2>{fileName}</h2>
          <CurrencyDropdown
            initial_currency={currencies[fileName]}
            onCurrencyChange={(currency) => onCurrencyChange(fileName, currency)}
          />

          {Object.keys(parsedTables[fileName]).map((tableId) => (
            <div key={tableId}>
              <EditableJsonTable
                data={parsedTables[fileName][tableId]}
                title={`Table ${tableId.charAt(1)}`}
                onDataChange={(updatedData) => onUpdateTable(fileName, tableId, updatedData)}
                onDeleteTable={() => onDeleteTable(fileName, tableId)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
