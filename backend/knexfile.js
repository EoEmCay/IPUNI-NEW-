require('dotenv').config();
const path = require('path');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres.gniozprudmekqftrshkb:DiaPlus%402026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

module.exports = {
  development: {
    client: 'pg',
    connection: DB_URL,
    migrations: {
      directory: path.join(__dirname, 'database', 'migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'database', 'seeds')
    }
  },
  production: {
    client: 'pg',
    connection: DB_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'database', 'migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'database', 'seeds')
    }
  }
};
