FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Set production env
ENV NODE_ENV=production
ENV PORT=3009

EXPOSE 3009

CMD ["node", "backend/server.js"]
