FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY public ./public
COPY src ./src
COPY index.html vite.config.js jsconfig.json eslint.config.js components.json ./
RUN npm run build

FROM nginx:alpine

COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i 's/listen 80;/listen 8080;/' /etc/nginx/conf.d/default.conf \
    && mkdir -p /var/cache/nginx /var/run \
    && chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
