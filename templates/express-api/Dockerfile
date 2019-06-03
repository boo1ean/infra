FROM node:12.3.1
WORKDIR /app
COPY package-lock.json package-lock.json
COPY package.json package.json
RUN npm install --production --quiet --depth=0
COPY src /app/src
EXPOSE 3000
CMD ["node", "/app/src"]
