require('dotenv').config();
const db = require('./src/config/database');
async function test() {
  try {
    console.log("Connecting...");
    const res = await db.raw('SELECT 1+1 as result');
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
test();
