const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const { analyzePrescription } = require('../src/modules/scan/scan.service');

async function testSingle() {
  const imgPath = path.join(__dirname, 'level_1_easy/rx_00025.png');
  console.log('Testing image:', imgPath);
  const buffer = fs.readFileSync(imgPath);
  const startTime = Date.now();
  try {
    const result = await analyzePrescription(buffer, 'image/png', 'vi');
    console.log('Execution Time:', ((Date.now() - startTime) / 1000).toFixed(2), 's');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Scan error:', err);
  }
}

testSingle();
