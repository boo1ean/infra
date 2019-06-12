FROM node:12.3.1
WORKDIR /app
COPY package-lock.json package-lock.json
COPY package.json package.json
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]
