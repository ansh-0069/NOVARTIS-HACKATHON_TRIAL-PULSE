# Use Node.js 18 on Debian Bullseye (has good Python support)
FROM node:18-bullseye

# Install Python 3 and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/ ./backend/

# Copy excel-service files
COPY excel-service/ ./excel-service/

# Install backend Node.js dependencies
WORKDIR /app/backend
RUN npm install

# Install Python dependencies for backend ML scripts
COPY backend/requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Python dependencies for excel-service
WORKDIR /app/excel-service
RUN pip3 install --no-cache-dir -r requirements.txt

# Set working directory back to backend (where server.js lives)
WORKDIR /app/backend

# Expose port (Railway will override this with its own PORT env var)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]