const express = require('express');
const cors = require('cors');
const axios = require('axios');
const XLSX = require('xlsx');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Cache mechanism
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

async function fetchAndParseExcel() {
  try {
    // Update with your Google Sheet ID
    const fileId = '15Sh8QPFF_r-oY9qtUPiSPpDBQlhXtn_y';
    // Use the direct export URL format
    const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx&id=${fileId}`;

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
    
    // Convert remaining rows to objects with all fields
    const data = filteredResult.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Preserve empty strings instead of converting to null/undefined
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return {
      data,
      headers,
      totalRows: data.length
    };
  } catch (error) {
    console.error('Excel fetch error:', error);
    throw new Error(`Failed to fetch Excel data: ${error.message}`);
  }
}

// Main API endpoint for JSON data
app.get('/api/data', async (req, res) => {
  try {
    // Check cache
    if (cachedData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      return res.json(cachedData);
    }

    const { data, headers, totalRows } = await fetchAndParseExcel();
    
    cachedData = {
      success: true,
      timestamp: new Date().toISOString(),
      total_records: totalRows,
      fields: headers,
      data: data
    };
    
    lastFetchTime = Date.now();
    res.json(cachedData);
  } catch (error) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Get fields endpoint
app.get('/api/fields', async (req, res) => {
  try {
    if (cachedData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        fields: cachedData.fields
      });
    }

    const { headers } = await fetchAndParseExcel();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      fields: headers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Get specific field values
app.get('/api/data/:field', async (req, res) => {
  try {
    const field = req.params.field;
    
    if (cachedData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      const fieldValues = cachedData.data.map(item => item[field]).filter(Boolean);
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        field,
        values: fieldValues
      });
    }

    const { data } = await fetchAndParseExcel();
    const fieldValues = data.map(item => item[field]).filter(Boolean);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      field,
      values: fieldValues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Force refresh endpoint
app.post('/api/refresh', async (req, res) => {
  try {
    const { data, headers, totalRows } = await fetchAndParseExcel();
    
    cachedData = {
      success: true,
      timestamp: new Date().toISOString(),
      total_records: totalRows,
      fields: headers,
      data: data
    };
    
    lastFetchTime = Date.now();
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      timestamp: cachedData.timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    status: 'healthy',
    lastUpdate: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cacheStatus: {
      isCached: !!cachedData,
      cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null,
      cacheExpiry: CACHE_DURATION
    }
  });
});

app.listen(port, () => {
  console.log(`API Server is running on port ${port}`);
  console.log('Available endpoints:');
  console.log('- GET  /api/data          : Get all data');
  console.log('- GET  /api/fields        : Get available fields');
  console.log('- GET  /api/data/:field   : Get specific field values');
  console.log('- POST /api/refresh       : Force cache refresh');
  console.log('- GET  /api/health        : Check API health');
}); 