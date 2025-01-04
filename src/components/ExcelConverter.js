import React, { useState, useEffect } from 'react';
import './ExcelConverter.css';

function ExcelConverter() {
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/excel-data');
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error);
        }

        setJsonData(result.data);
        setFields(result.fields);
        setLoading(false);
      } catch (err) {
        setError('Error fetching data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderFieldsList = () => {
    return (
      <div className="fields-list">
        <h3>Available Fields:</h3>
        <ul>
          {fields.map((field, index) => (
            <li key={index}>{field}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDataTable = () => {
    if (!jsonData || jsonData.length === 0) return null;

    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {fields.map((field, index) => (
                <th key={index}>{field}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jsonData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {fields.map((field, colIndex) => (
                  <td key={colIndex}>{row[field]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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