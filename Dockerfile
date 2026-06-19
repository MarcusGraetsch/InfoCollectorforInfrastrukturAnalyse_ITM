# Erwartet dass dist/ bereits auf dem Host gebaut wurde (via install.sh / npm run build).
# Kein Build-Schritt im Container — vermeidet npm/tsc-Probleme in Corporate-Umgebungen.
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
