# Build stage (slim: Alpine에서 npm install 시 exit 139 방지)
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve with nginx; API_UPSTREAM injected at runtime (Compose: http://server:3000, Railway: http://server.railway.internal:PORT)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://server:3000
EXPOSE 80
# Official nginx image runs /docker-entrypoint.d/20-envsubst-on-templates.sh automatically
CMD ["nginx", "-g", "daemon off;"]
