const https = require('https');
const http = require('http');

async function checkURL(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${url} - Status: ${res.statusCode}`);
        if (data.includes('A5X') || data.includes('CRM') || res.statusCode === 200) {
          console.log(`   Response preview: ${data.substring(0, 100)}...`);
        }
        resolve({ url, status: res.statusCode, found: true });
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Error: ${err.message}`);
      resolve({ url, status: 'error', found: false });
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      console.log(`⏱️ ${url} - Timeout`);
      resolve({ url, status: 'timeout', found: false });
    });
  });
}

async function findProductionBackend() {
  console.log('🔍 Searching for your production backend with your 130+ leads...\n');
  
  // Common backend deployment URLs
  const possibleUrls = [
    // Render patterns
    'https://a5x-crm-backend.onrender.com',
    'https://crm-backend.onrender.com',
    'https://a5x-backend.onrender.com',
    'https://wizardedllya-backend.onrender.com',
    
    // Vercel patterns 
    'https://crm-backend-tan-six.vercel.app',
    'https://a5x-crm-backend.vercel.app',
    
    // Railway patterns
    'https://a5x-crm-backend.railway.app',
    'https://crm-backend.railway.app',
    
    // Heroku patterns
    'https://a5x-crm-backend.herokuapp.com',
    'https://crm-backend.herokuapp.com',
    
    // Add API endpoint to check
    'https://a5x-crm-backend.onrender.com/api/v1',
    'https://crm-backend.onrender.com/api/v1',
    'https://a5x-backend.onrender.com/api/v1',
  ];
  
  console.log('🌐 Checking possible backend URLs...\n');
  
  for (const url of possibleUrls) {
    await checkURL(url);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log('\n🔍 If any URL above returned 200 status, that might be your production backend!');
  console.log('We can then check that backend\'s database for your 130+ leads.');
}

findProductionBackend().catch(console.error);