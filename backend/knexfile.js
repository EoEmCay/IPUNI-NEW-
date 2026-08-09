require('dotenv').config();
const path = require('path');

// QUAN TRỌNG: KHÔNG hard-code chuỗi kết nối Postgres thật ở đây làm giá trị mặc định.
// Trước đây có 1 fallback trỏ thẳng tới DB Supabase production - nghĩa là bất kỳ ai
// chạy `npm run dev` cục bộ mà quên set DATABASE_URL sẽ vô tình đọc/ghi thẳng vào dữ
// liệu bệnh nhân thật. Nếu thiếu DATABASE_URL, môi trường development giờ dùng SQLite
// cục bộ (không đụng tới DB thật); production BẮT BUỘC phải có DATABASE_URL, không có
// fallback nào cả - thiếu biến này sẽ khiến app từ chối kết nối thay vì âm thầm dùng
// một giá trị mặc định không ai kiểm soát được.
module.exports = {
  development: process.env.DATABASE_URL
    ? {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        migrations: {
          directory: path.join(__dirname, 'database', 'migrations')
        },
        seeds: {
          directory: path.join(__dirname, 'database', 'seeds')
        }
      }
    : {
        // Không có DATABASE_URL -> SQLite cục bộ, KHÔNG BAO GIỜ fallback về DB thật.
        client: 'sqlite3',
        connection: {
          filename: path.join(__dirname, 'database', 'dev.sqlite3')
        },
        useNullAsDefault: true,
        migrations: {
          directory: path.join(__dirname, 'database', 'migrations')
        },
        seeds: {
          directory: path.join(__dirname, 'database', 'seeds')
        }
      },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
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
