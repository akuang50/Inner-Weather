# ---- Stage 1: build the Vite site ----
FROM node:20 AS web
WORKDIR /web
COPY site/package*.json ./
RUN npm install
COPY site/ ./
RUN npm run build

# ---- Stage 2: Python server that also serves the built site ----
FROM python:3.12-slim
WORKDIR /app
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server/ ./server/
COPY --from=web /web/dist ./site/dist
WORKDIR /app/server
CMD ["sh", "-c", "uvicorn chatbot:app --host 0.0.0.0 --port ${PORT:-8000}"]
