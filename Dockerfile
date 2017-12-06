FROM node:latest

# Create app directory
RUN mkdir -p /usr/crh
WORKDIR /usr/crh


# Install app dependencies
COPY package.json /usr/crh/

RUN npm install

# Bundle app source
COPY . /usr/crh

ENV PORT 2100
EXPOSE ${PORT}

CMD [ "npm", "start" ]