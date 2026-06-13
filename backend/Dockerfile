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

# The start script from package.json
CMD ["npm", "start"]
