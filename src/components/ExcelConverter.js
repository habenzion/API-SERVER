import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './ExcelConverter.css';

function ExcelConverter() {
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    const fetchExcel = async () => {
      try {
        const fileId = '15Sh8QPFF_r-oY9qtUPiSPpDBQlhXtn_y';
        const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;

        const response = await axios.get(exportUrl, {
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        });

        const workbook = XLSX.read(response.data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get all data including empty cells
        const result = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          defval: ''
        });

        // Filter out completely empty rows
        const filteredResult = result.filter(row => row.some(cell => cell !== ''));
        
        // Extract headers (first row)
        const headers = filteredResult[0];
        setFields(headers);

        // Convert remaining rows to objects with all fields
        const data = filteredResult.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            // Preserve empty strings instead of converting to null/undefined
            obj[header] = row[index] || '';
          });
          return obj;
        });

        setJsonData(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching or processing Excel file: ' + err.message);
        setLoading(false);
      }
    };

    fetchExcel();
  }, []);

  const renderFieldsList = () => {

  };

  const renderDataTable = () => {
    if (!jsonData || jsonData.length === 0) return null;

  
  };

  return (
    <div className="excel-converter">
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="loading">Loading Excel data...</div>
      ) : (
        <>
          {jsonData && (
            <>
              {renderFieldsList()}
              {renderDataTable()}
              <div className="json-output">
                <pre>{JSON.stringify(jsonData, null, 2)}</pre>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ExcelConverter; 