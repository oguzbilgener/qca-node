FROM node:12.14.0-alpine as base
RUN mkdir /qca-node
ADD . /qca-node
WORKDIR /qca-node
RUN npm i
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]