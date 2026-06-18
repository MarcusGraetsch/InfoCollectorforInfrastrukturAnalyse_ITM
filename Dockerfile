# ── Stage 1: Build ──────────────────────────────────────────────────────────
# Baut die App reproduzierbar im Container — kein host-seitiges `npm run build`
# mehr nötig (dist/ steht in .gitignore und ist nicht reproduzierbar).
FROM node:20-alpine AS build
WORKDIR /app

# Abhängigkeiten zuerst (besseres Layer-Caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Quellcode kopieren und bauen
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
