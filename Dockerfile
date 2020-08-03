FROM node:12.14.0-alpine as base
RUN mkdir /qca-node
ADD . /qca-node
WORKDIR /qca-node
RUN npm i
RUN npm run build

# `npm install` installs development dependencies and `npm prune --production`
# doesn't really remove the dev dependencies.
# So start from a new base image, copy the final build/ directory and only
# install dev dependencies to save more than 100+ MB of space.

FROM node:12.14.0-alpine
RUN apk --no-cache add tini

WORKDIR /qca-node
COPY --from=base /qca-node/assets ./assets
COPY --from=base /qca-node/build ./build
COPY --from=base /qca-node/openapi ./openapi
COPY --from=base /qca-node/package.json ./package.json
COPY --from=base /qca-node/package-lock.json ./package-lock.json

RUN npm ci --only=production
RUN rm -rf .npmrc ~/.npm ~/.cache

EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "build/index.js"]