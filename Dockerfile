FROM node:7
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUn npm install
COPY . /app
CMD node app.js
EXPOSE 8082
