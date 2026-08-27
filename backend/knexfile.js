require('dotenv').config();
const path = require('path');

// QUAN TRỌNG: KHÔNG hard-code chuỗi kết nối Postgres thật ở đây làm giá trị mặc định.
// Trước đây có 1 fallback trỏ thẳng tới DB Supabase production - nghĩa là bất kỳ ai
// chạy `npm run dev` cục bộ mà quên set DATABASE_URL sẽ vô tình đọc/ghi thẳng vào dữ
// liệu bệnh nhân thật. Nếu thiếu DATABASE_URL, môi trường development giờ dùng SQLite
// cục bộ (không đụng tới DB thật); production BẮT BUỘC phải có DATABASE_URL, không có
// fallback nào cả - thiếu biến này sẽ khiến app từ chối kết nối thay vì âm thầm dùng
// một giá trị mặc định không ai kiểm soát được.
function tuneSqlite(conn, done) {
  const pragmas = [
    'PRAGMA journal_mode = WAL',
    'PRAGMA synchronous = NORMAL',
    'PRAGMA busy_timeout = 5000',
    'PRAGMA cache_size = -20000', // ~20MB
    'PRAGMA temp_store = MEMORY',
    'PRAGMA foreign_keys = ON',
    'PRAGMA mmap_size = 134217728', // 128MB
  ];
  let i = 0;
  const next = (err) => {
    if (err || i >= pragmas.length) return done(err, conn);
    conn.run(pragmas[i++], next);
  };
  next();
}

const sqliteConfig = {
  client: 'sqlite3',
  connection: {
    filename: process.env.SQLITE_PATH || path.join(__dirname, 'database', 'dev.sqlite3')
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 5,
    afterCreate: tuneSqlite
  },
  migrations: {
    directory: path.join(__dirname, 'database', 'migrations')
  },
  seeds: {
    directory: path.join(__dirname, 'database', 'seeds')
  }
};

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
    : sqliteConfig,

  production: process.env.DATABASE_URL
    ? {
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
    : sqliteConfig
};
