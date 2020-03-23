# qca-node

![Node.js CI](https://github.com/oguzbilgener/qca-node/workflows/Node.js%20CI/badge.svg)

This is a web service that provides a simple HTTP REST API to create, retrieve, update and delete messages. The API is defined as an OpenAPI 3.0 (a.k.a. Swagger) specification.

A live demo and the interactive API documentation is available at [https://qca-node.bilgener.ca](https://qca-node.bilgener.ca). The endpoint for the Message resources is `/v1/messages`.

### Architecture and Implementation Details

The API server is a Node.js Express application. The API endpoints, data entities, query parameters and response formats are declared in yaml files.

This project uses a library called [Exegesis](https://github.com/exegesis-js/exegesis) to parse the API specification from the yaml files, validate incoming requests and call the relevant controller function upon an incoming request.

Controllers parse request parameters and body, convert public API schema objects into internal objects compatible with the database layer.

Services contain the business logic, they execute the CRUD operations and decorate the result with additional computed metadata. In this project, an example is calling `isPalindrome()`.

This project uses MongoDB for persistence and the Mongoose library to define schemas, and interact with MongoDB.

Below is a simple diagram of the architecture:

```
+-----------------------------+
|                             |
|     OpenAPI Controllers     |
|                             |
+--------------+--------------+
               |
               |
               v
+--------------+--------------+
|          Services           |
|      (MessageService)       |
|                             |
+--------------+--------------+
               |
               |
               v
+--------------+--------------+
|            Models           |
|     Mongoose / MongoDB      |
|                             |
+-----------------------------+
```

#### File / Directory Structure

- **`openapi/`** contains the yaml files that declare the REST API according to OpenAPI specifications.
- **`src/controllers/`** contains the controllers run by the Exegesis OpenAPI library.
- **`src/services`** contains the business logic for the CRUD operations, pagination etc.
- **`src/models`** contains the Mongoose models, as well as the TypeScript types for entities.
- **`src/helpers`** contains various utilities, middleware as well as the palindrome logic.
- **`test/`** contains the unit and integration tests following the same directory structure as `src/`.
- **`cli/`** contains the sub-project for the command line utility.

#### API Versioning

This project follows semantic versioning. Any breaking change in the API entities, response formats or parameters should result in incrementing the major version number.
The API specification follows the version number in package.json and all endpoints are served from a route that contains the major version number. In this case, it is `/v1`. In the case of a breaking change, a v2 app can be deployed alongside the v1 app and they can be served by the same reverse proxy / load balancer in a cloud environment.

### Testing and CI

The tests can simply be run with the `npm test` command. These tests cover the important parts such as message CRUD operations, palindrome checking, and the actual OpenAPI endpoints.

There are two kinds of tests:

- Unit tests for business logic, controllers where the database queries are mocked.
- Integration tests with a real HTTP server and a database.

For simplicity, all test suites are run by Jest at once, and Jest launches an in-memory MongoDB server for the API integration tests.

GitHub Actions runs the test suite on every commit, however it doesn't create container images or do automated deployment.

### API Documentation

The API documentation is served live on the API server on the [home page](https://qca-node.bilgener.ca), but below is a summary as well:

<details><summary>Click here to expand the API Documentation</summary>

#### `GET /v1/messages`

Retrieve a list of messages, sorted in the descending order for the creation
date. In order to load the next page, provide the `afterId` query string parameter.
Returns a list of messages, paginated. You can load up to 1000 messages at once with the `limit` query string parameter.

Sample Response body with 1 item:

```json
{
  "lastId": "5e6e5461a712d52c732f7162",
  "hasMore": false,
  "items": [
    {
      "id": "5e6d938fbe47ac3a186940d9",
      "content": "Hello world!",
      "createdAt": "2020-03-14T21:00:00Z",
      "updatedAt": "2020-03-15T14:42:00Z",
      "palindrome": false
    }
  ]
}
```

In order to load the next page, make a request like `GET /v1/messages?afterId=5e6e5461a712d52c732f7162`.

#### `GET /v1/messages/{id}`

Retrieve a message by ID.

Sample Response body:

```json
{
  "id": "5e6d938fbe47ac3a186940d9",
  "content": "Hello world!",
  "createdAt": "2020-03-14T21:00:00Z",
  "updatedAt": "2020-03-15T14:42:00Z",
  "palindrome": false
}
```

#### `POST /v1/messages`

Create a new message with a nonempty content.

Request body:

```json
{
  "content": "Hello world!"
}
```

Response body:

```json
{
  "id": "5e6d938fbe47ac3a186940d9",
  "content": "Hello world!",
  "createdAt": "2020-03-14T21:00:00Z",
  "updatedAt": "2020-03-15T14:42:00Z",
  "palindrome": false
}
```

#### `PUT /v1/messages/{id}`

Update a message content.

Request body:

```json
{
  "content": "Hello world! 2"
}
```

Response:

```json
{
  "id": "5e6d938fbe47ac3a186940d9",
  "content": "Hello world! 2",
  "createdAt": "2020-03-14T21:00:00Z",
  "updatedAt": "2020-03-15T14:42:00Z",
  "palindrome": false
}
```

#### `DELETE /v1/messages/{id}`

Delete a message.

Response is HTTP 204.

</details>

### Running the App Locally

#### Create an `.env` file

Create a file called `.env` in the project root folder for the environment variables. Use the `.env.sample` file as a template, and fill in some of the essential variables such as `MONGO_URL` and `HTTP_PORT`.

`$ cp .env.sample .env`

#### Without Docker

<details><summary>Click here to expand the instructions for building the project</summary>

##### Prerequisites:

- Node 12 on a recent Linux or Mac OS system. I haven't tried running this app on Windows, at all.
- A MongoDB server running a recent version with an exposed port available to the app running on the localhost.
- The `.env` file with an available port number and the full MongoDB connection URI.

##### Build and Run

- Install the runtime and build time dependencies with:

  `$ npm install`

- Build the server application, then run it:

  `$ npm run build && npm devstart`

This will run the web server until you terminate the process. The web server should now be available at `http://localhost:8080`, if your port number is 8080.

</details>

#### With Docker Compose

<details><summary>Click here to expand the instructions for Docker Compose</summary>

- Create your `.env` file. Make sure the hostname for the MongoDB is the service name declared in the `docker-compose.yaml` file (mongo) and the port number in the .env file matches the exposed port for the web app in the `docker-compose.yaml` file.

- Start the web app and the database container in the background:

`$ docker-compose up -d`

Your app now should be available at the port you picked, such as `http://localhost:8080`.

To stop the app and the database containers and destroy them, run:

`$ docker-compose down`

</details>

#### With Minikube

<details><summary>Click here to expand the instructions for Minikube</summary>

- Instead of the `.env` file, edit the `deploy/qca-node.yaml` file if necessary. (sorry)

- Deploy the web app and the MongoDB service to your Minikube cluster:

  `$ kubectl apply -f deploy/qca-node.yaml -f deploy/mongo.yaml`

This will download and deploy a prebuilt image of the application from Docker Hub.

- Expose the web app's HTTP interface to your local machine:

  `$ minikube service --url qca-node-np`

This should print the address of the service that is currently running, like `http://192.168.99.101:30780`.

</details>

### Deploying the App

The prebuilt container image can be deployed to any cloud container service. The live demo runs on a simple, three-node cluster on Amazon Elastic Kubernetes Service. The web service is exposed via an ALB Ingress Controller (configuration can be found in deploy/qca-node-ingress.yaml) which sets up an Application Load Balancer. There is also an ExternalDNS service in the same cluster that creates DNS records in Route53 from the ALB Ingress configuration. Right now I'm hesitant to share the yaml files for configuring that and the EKS cluster as I don't believe I have perfected all the settings yet.

Warning: This project is currently not using any secret management tool and all configuration is provided via environment variables.


### Command Line Utility

This project comes with a simple command line utility to create, retrieve update and delete messages. A pre-built executable script version of the CLI that only requires Node.js (v12) is committed to this repository, so it can be simply run with the following command:

`$ ./bin/qca-cli`

This will print a help message that lists all available commands and options. By default, the cli connects to the example server hosted at `https://qca-node.bilgener.ca`. Below are some example usages for the CLI:

- `$ bin/qca-cli list`
- `$ bin/qca-cli --host https://your-api-server.com create "Hello, world!"`
- `$ bin/qca-cli --host https://your-api-server.com get 5e7583b9a36bd55944f64ede`

The source code for the CLI can be found in `cli/main.ts`.
A new version of the qca-cli executable can be built by running the `cli/build-cli.sh` script.

### Generate sample data

There is another script to populate the database with some messages (taken from bobrosslipsum.com). This one is not pre-built, so make sure to run `npm install` on the main project first.
Then, simply run the following command where `http://localhost:8080` is the address your API server.

`$ npm run scaffold -- -H http://localhost:8080`
