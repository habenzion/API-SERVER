const express = require('express');
const cors = require('cors');
const axios = require('axios');
const XLSX = require('xlsx');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchAndParseExcel() {
  try {
    const fileId = '15Sh8QPFF_r-oY9qtUPiSPpDBQlhXtn_y';
    const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;

    console.log('Fetching Excel file from:', exportUrl);

    const response = await axios.get(exportUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    const workbook = XLSX.read(response.data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Get raw data with headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null
    });

    console.log('Total Records:', rawData.length);
    console.log('Sample Record:', rawData[0]);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      total_records: rawData.length,
      data: rawData
    };
  } catch (error) {
    console.error('Excel fetch error:', error);
    throw new Error(`Failed to fetch Excel data: ${error.message}`);
  }
}

// Main data endpoint
app.get('/api/data', async (req, res) => {
  try {
    if (cachedData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      return res.json(cachedData);
    }

    const data = await fetchAndParseExcel();
    cachedData = data;
    lastFetchTime = Date.now();
    res.json(data);
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
    const data = await fetchAndParseExcel();
    
    const fieldValues = data.data
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      field,
      values: fieldValues,
      total_values: fieldValues.length
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
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: {
      isCached: !!cachedData,
      lastUpdate: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
      timeToExpiry: lastFetchTime ? CACHE_DURATION - (Date.now() - lastFetchTime) : null
    }
  });
});

// Force cache refresh
app.post('/api/refresh', async (req, res) => {
  try {
    const data = await fetchAndParseExcel();
    cachedData = data;
    lastFetchTime = Date.now();
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Add this new endpoint for ads
app.get('/api/ads', async (req, res) => {
  try {
    const fileId = '1B1RcfrX1_w7i1yHnPnjM724dLY7n6xiL';
    const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;

    console.log('Fetching Ads Excel file from:', exportUrl);

    const response = await axios.get(exportUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    const workbook = XLSX.read(response.data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Get raw data with headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: null
    });

    // Transform the data into the required format
    const formattedAds = rawData.map((row, index) => ({
      title: row.Title || row.title || '',
      message: row.Message || row.message || row.Description || row.description || '',
      imageUrl: row.ImageUrl || row.imageUrl || row.IconUrl || row.iconUrl || 
                `https://picsum.photos/200/300?random=${index}`,
      actionLink: row.ActionLink || row.actionLink || row.Link || row.link || '#',
      actionText: row.ActionText || row.actionText || row.Button || row.button || 'Learn More'
    })).filter(ad => ad.title || ad.message); // Filter out empty entries

    console.log('Total Ads:', formattedAds.length);
    console.log('Sample Ad:', formattedAds[0]);

    res.json(formattedAds);

  } catch (error) {
    console.error('Ads fetch error:', error);
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('\nAvailable endpoints:');
  console.log('- GET  /api/data          : Get all Excel data');
  console.log('- GET  /api/raw           : Get raw Excel data');
  console.log('- GET  /api/health        : Check server health');
  console.log('- POST /api/refresh       : Force refresh cache');
}); 