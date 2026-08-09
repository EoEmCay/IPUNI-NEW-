const knex = require('knex');
const knexConfig = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexConfig[env];

if (!config) {
  throw new Error(`Không tìm thấy cấu hình Knex cho môi trường "${env}". Kiểm tra knexfile.js.`);
}

const db = knex(config);

module.exports = db;
