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

# Chạy migration rồi khởi động server. KHÔNG chạy seed: seed chỉ dành cho dev/test,
# trong production các file seed chủ động báo lỗi để không ghi dữ liệu mẫu vào DB thật.
CMD ["sh", "-c", "npm run migrate && npm start"]