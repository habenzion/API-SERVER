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
    const fileId = '15Sh8QPFF_r-oY9qtUPiSPpDBQlhXtn_y';
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
    
    const result = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false,
      defval: ''
    });

    const filteredResult = result.filter(row => row.some(cell => cell !== ''));
    const headers = filteredResult[0];
    
    const data = filteredResult.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
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

// API Routes
app.get('/api/data', async (req, res) => {
  try {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 