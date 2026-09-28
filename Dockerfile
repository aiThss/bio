# Production Dockerfile for aiThss Bio
FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY server.js ./
COPY public ./public
COPY data ./data

# Expose server port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Persist data directory with volume
VOLUME ["/app/data"]

CMD ["node", "server.js"]
