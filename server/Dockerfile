FROM node:20-slim

# mongodb-memory-server (used by the integration test suite) boots a bundled
# mongod binary at test time. On Debian-slim it requires libcurl4 + openssl
# at runtime; slim doesn't include them by default.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libcurl4 openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
