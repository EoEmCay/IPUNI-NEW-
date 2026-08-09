require('dotenv').config();
const db = require('./src/config/database');
async function check() {
  const user = await db('users').where({ email: 'nguyenlehongquy@gmail.com' }).first();
  console.log(user);
  process.exit(0);
}
check();
