# this two-stage build makes the final image much smaller
# as it contains only the final built app

# build environment
FROM docker-registry.ebrains.eu/neuralactivity/node:20-alpine AS build
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --silent
COPY . ./
RUN npm run build

# production environment
FROM docker-registry.ebrains.eu/neuralactivity/nginx:stable-alpine
COPY deployment/nginx_default /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Allow nginx to run as non-root: port 8080 doesn't require privilege,
# but nginx needs to write its pid file and cache dirs.
# Use UID 1001 explicitly to match the runAsUser in the K8s security context.
RUN touch /var/run/nginx.pid \
    && chown -R 1001:0 /var/run/nginx.pid \
    && chown -R 1001:0 /var/cache/nginx \
    && chown -R 1001:0 /usr/share/nginx/html

USER 1001
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
