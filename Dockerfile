FROM node:18-bullseye

# Install Python and clean up
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# LAYER 1: Python Dependencies (Cached)
COPY excel-service/requirements.txt ./excel-service/
WORKDIR /app/excel-service
RUN pip3 install -r requirements.txt --break-system-packages

# LAYER 2: Node.js Dependencies (Cached)
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

# LAYER 3: Source Code
WORKDIR /app
COPY backend/ ./backend/
COPY excel-service/ ./excel-service/

# Final Setup
WORKDIR /app/backend
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server.js"]
