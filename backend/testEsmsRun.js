require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function main() {
  const apiKey = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;
  
  const testPhone = '84901234567';
  const content = 'Ma OTP xac thuc DIA+ cua ban la 123456';
  const url = `https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?Phone=${testPhone}&Content=${encodeURIComponent(content)}&ApiKey=${apiKey}&SecretKey=${secretKey}&SmsType=2`;

  try {
    const res = await axios.get(url, { timeout: 8000 });
    fs.writeFileSync('testEsmsOut.txt', JSON.stringify(res.data, null, 2));
  } catch (err) {
    fs.writeFileSync('testEsmsOut.txt', 'ERROR: ' + err.message);
  }
}

main();
