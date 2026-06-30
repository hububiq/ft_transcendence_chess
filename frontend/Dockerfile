# --- STAGE 1: Base ---
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# --- STAGE 2: Development ---
FROM base AS development
COPY . .
EXPOSE 3000
# Runs the Vite hot-reloading server. # The "--", "--host" safely passes the 0.0.0.0 flag to Vite so it escapes the Docker container
# Vite is forced to use port 3000 like historical React-Create-App because we configured CORS already for 3000
CMD ["sh", "-c", "npm install && npm run dev -- --host --port 3000"] 

# --- STAGE 3: Production (for eval) ---
FROM base AS production
COPY . .
RUN npm run build
# Switch to Nginx
FROM nginx:alpine
COPY --from=production /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# nginx.conf will include routing /api traffic to django and /ws to fastapi ascting as a "API Gateway"