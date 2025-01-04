import React, { useState, useEffect } from 'react';
import './BlankPage.css';

function BlankPage() {
  const [data, setData] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedField, setSelectedField] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/data');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setData(result.data);
      setFields(result.fields);
      setLoading(false);
    } catch (err) {
      setError('Error fetching data: ' + err.message);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:5000/api/refresh', { method: 'POST' });
      await fetchData();
    } catch (err) {
      setError('Error refreshing data: ' + err.message);
      setLoading(false);
    }
  };

  const renderDataTable = () => {
    if (!data || data.length === 0) return null;

    return (
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {fields.map((field, index) => (
                <th 
                  key={index}
                  onClick={() => setSelectedField(field)}
                  className={selectedField === field ? 'selected' : ''}
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {fields.map((field, colIndex) => (
                  <td 
                    key={colIndex}
                    className={selectedField === field ? 'selected' : ''}
                  >
                    {row[field]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="blank-page">
      <h2>Excel Data API</h2>
      <div className="content">
        <div className="controls">
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : (
          <>
            <div className="data-section">
              <h3>Data Preview</h3>
              {renderDataTable()}
            </div>
            
            <div className="api-endpoints">
              <h3>Available Endpoints:</h3>
              <ul>
                <li><code>GET /api/data</code> - Fetch all data</li>
                <li><code>GET /api/fields</code> - Get available fields</li>
                <li><code>GET /api/data/:field</code> - Get specific field values</li>
                <li><code>POST /api/refresh</code> - Force cache refresh</li>
                <li><code>GET /api/health</code> - Check API health</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BlankPage; 