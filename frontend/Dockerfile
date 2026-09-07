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
FROM base AS builder
COPY . .
RUN npm run build

# Switch to Nginx
# FROM nginx:alpine AS production

# # Generate a self-signed cert at build time (fine for eval/local; swap for
# # real certs / certbot in an actual production deploy)
# RUN apk add --no-cache openssl && \
#     mkdir -p /etc/nginx/ssl && \
#     openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#       -keyout /etc/nginx/ssl/privkey.pem \
#       -out /etc/nginx/ssl/fullchain.pem \
#       -subj "/CN=localhost"

# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf 
# EXPOSE 80 443
# # EXPOSE 8443
# CMD ["nginx", "-g", "daemon off;"]

# # nginx.conf will include routing /api traffic to django and /ws to fastapi ascting as a "API Gateway"

# Switch to Nginx
FROM nginx:alpine AS production

ARG HOST_IP=${}
ENV HOST_IP=${}

# # Generate a self-signed TLS certificate for local and evaluation deployment
# RUN apk add --no-cache openssl && \
#     mkdir -p /etc/nginx/ssl && \
#     openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#       -keyout /etc/nginx/ssl/privkey.pem \
#       -out /etc/nginx/ssl/fullchain.pem \
#       -subj "/CN=localhost" \
#       -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:${HOST_IP}"
# Generate a self-signed cert at build time (fine for eval/local; swap for
# real certs / certbot in an actual production deploy)
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/privkey.pem \
      -out /etc/nginx/ssl/fullchain.pem \
      -subj "/CN=10.13.4.3" \
      -addext "subjectAltName=IP:10.13.4.3,DNS:localhost"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]