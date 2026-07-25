const db = require('./backend/src/config/database');
const { daysAgo } = require('./backend/src/utils/date.helper');

async function test() {
  const since90 = daysAgo(90);
  const since7 = daysAgo(7);
  
  const metrics90 = await db('metrics').where('measured_at', '>=', since90).orderBy('measured_at', 'desc');
  const metrics7 = await db('metrics').where('measured_at', '>=', since7).orderBy('measured_at', 'desc');
  
  console.log('90 days count:', metrics90.length);
  console.log('7 days count:', metrics7.length);
  
  if (metrics90.length > 0) {
    console.log('Sample 90:', metrics90.map(m => ({ value: m.value, type: m.measurement_type })));
  }
  
  process.exit(0);
}
test();
