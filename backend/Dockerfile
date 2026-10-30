FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Run DB migrations/seeds if needed (optional)
# RUN npm run migrate

EXPOSE 3001

# Chạy migrations rồi khởi động. KHÔNG chạy seed: seed chứa tài khoản mẫu và tự báo lỗi khi NODE_ENV=production.
CMD ["sh", "-c", "npm run migrate && npm start"]