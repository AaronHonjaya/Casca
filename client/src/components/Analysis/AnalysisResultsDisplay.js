// AnalysisResults.jsx
import React from "react";
import { DownloadCSVButton } from "./DownloadCSVButton";
export const AnalysisResults = ({ results }) => {
  if (!results) return null;

  
  return (
    <div style={{ marginTop: "1rem" }}>
      <h1>Analysis Results</h1>
      {Object.entries(results).map(([fileLabel, fileData]) => (
        <div key={fileLabel} style={{ marginBottom: "1rem" }}>
          <h2>{fileLabel}</h2>

          {Object.entries(fileData).map(([tableName, tableStats]) => (
            <div key={tableName} style={{ paddingLeft: "1rem" }}>
              <h3>{tableName}</h3>
              <p>Avg Monthly Credit: {tableStats.avg_monthly_credit}</p>
              <p>Avg Monthly Debit: {tableStats.avg_monthly_debit}</p>

              <h4>Monthly Breakdown:</h4>
              <DownloadCSVButton data={tableStats.monthly_breakdown} name={`${fileLabel}_${tableName}_monthly_breakdown.csv`} />
              <MonthlyBreakdownTable monthlyBreakdown={tableStats.monthly_breakdown} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};



const MonthlyBreakdownTable = ({ monthlyBreakdown }) => {
  if (!monthlyBreakdown || Object.keys(monthlyBreakdown).length === 0) {
    return <p>No monthly data available.</p>;
  }

  // Create the pivot
  const pivotedData = pivotMonthlyDataReversed(monthlyBreakdown);
  // pivotedData looks like:
  // [
  //   { metric: 'mean', '1-2019': 3.74, '2-2019': 10.50 },
  //   { metric: 'stddev', '1-2019': 7.36, '2-2019': 3.12 },
  //   ...
  // ]

  // Extract the month columns by scanning the first row (besides the metric)
  // e.g. ["metric", "1-2019", "2-2019"]
  const allColumns = Object.keys(pivotedData[0]);
  // We'll show "metric" first, then all the months
  const columns = ["metric", ...allColumns.filter((c) => c !== "metric")];

  return (
    <table border="1" cellPadding="5" cellSpacing="0">
      <thead>
        <tr>
          {/* For each column key, display it as a header */}
          {columns.map((colKey) => (
            <th key={colKey}>{colKey}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pivotedData.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((colKey) => (
              <td key={colKey}>
                {/* Convert to string or format as needed */}
                {typeof row[colKey] === "number"
                  ? row[colKey].toFixed(2)
                  : String(row[colKey].split("_").join(" "))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// The pivot function
function pivotMonthlyDataReversed(monthlyBreakdown) {
  const months = Object.keys(monthlyBreakdown);
  if (months.length === 0) return [];

  // gather all metrics
  const allMetrics = new Set();
  months.forEach((m) => {
    Object.keys(monthlyBreakdown[m]).forEach((metric) => {
      allMetrics.add(metric);
    });
  });

  // build one row per metric
  const result = [];
  for (let metric of allMetrics) {
    const row = { metric };
    months.forEach((m) => {
      // default 0 or some fallback if missing
      row[m] = monthlyBreakdown[m][metric] ?? 0;
    });
    result.push(row);
  }

  return result;
}

// export default MonthlyBreakdownTable;




// const MonthlyBreakdownTable = (monthlyBreakdown) => {

//   const mbArray = Object.entries(monthlyBreakdown).map(([key, value]) => {
//     return{
//       month: key,
//       ...value
//     }
//   });
//   console.log(mbArray);
//   const columns = Object.keys(mbArray[0]);
//   return (
//     <table border="1" cellPadding="5" cellSpacing="0">
//       <thead>
//         <tr>
//           {columns.map((colKey) => (
//             <th key={colKey}>{colKey}</th>
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         {mbArray.map((row, rowIndex) => (
//           <tr key={rowIndex}>
//             {columns.map((colKey) => (
//               <td key={colKey}>
//                 {/* If colKey is an object or array, convert to string */}
//                 {typeof row[colKey] === "object"
//                   ? JSON.stringify(row[colKey])
//                   : String(row[colKey])}
//               </td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
//   // return (
//   //   <table border="1" cellPadding="5" cellSpacing="0">
//   //     <thead>
//   //       <tr>
//   //         {columns.map((colKey) => (
//   //           <th key={colKey}>{colKey}</th>
//   //         ))}
//   //       </tr>
//   //     </thead>
//   //     <tbody>
//   //         {mbArray.map((row, rowIndex) => (
//   //         <tr key={rowIndex}>
//   //             {columns.map((colKey) => (
//   //             <td key={colKey}>
//   //                 {/* Convert to string or format as needed */}
//   //                 {String(row[colKey])}
//   //             </td>
//   //             ))}
//   //         </tr>
//   //         ))}
//   //     </tbody>
//   //   </table>
//   // )
  
// }
