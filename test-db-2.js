const db = require('./backend/src/config/database');
const { daysAgo } = require('./backend/src/utils/date.helper');

async function test() {
  const since90 = daysAgo(90);
  console.log("since90:", since90);
  const metrics90 = await db('metrics').where('measured_at', '>=', since90).orderBy('measured_at', 'desc');
  console.log('All metrics from since90:', metrics90.length);
  metrics90.forEach(m => console.log(`${m.measured_at} - ${m.value} - ${typeof m.value} - ${m.user_id}`));
  
  process.exit(0);
}
test();
