import fs from 'fs';
import path from 'path';
import express from 'express';
import { middleware as exegesisExpressMiddleware } from 'exegesis-express';
import { ExegesisOptions } from 'exegesis';
import { connect } from './models/index';
import loadConfig from './config';
import { Config } from './config/types';
import { OpenApiValidator } from 'express-openapi-validator';
import { getCodeFromError, isValidationError, ValidationError } from './helpers/errors';
import { customFormatValidators } from './helpers/formats';
import log, { requestLoggingMiddleware, setLevel as setLogLevel } from './helpers/log';
import * as messagesController from './controllers/messages';
import { absolutePath } from 'swagger-ui-dist';
import refParser from '@apidevtools/json-schema-ref-parser';
import yaml from 'js-yaml';

const pathToSwaggerUi = absolutePath();

const API_SPEC = path.resolve(__dirname, '../openapi/openapi.yaml');
const SWAGGER_HTML = fs.readFileSync(path.resolve(__dirname, '../assets/swagger.html'), {
    encoding: 'utf-8',
});

export async function createServer(overrideConfig?: Config) {
    const app = express();

    const config = overrideConfig || loadConfig();
    setLogLevel(config.logLevel);

    log.info(`Launching qca-node API server in ${config.env} environment mode`);

    // Validate the static schema of the API declaration only.
    // The request and response validation is done by Exegesis too.
    await new OpenApiValidator({
        apiSpec: API_SPEC,
        unknownFormats: ['ObjectId'],
    });

    await connect(config.db);

    // Liveness probe. Defined above the logger middleware so it doesn't pollute the logs.
    app.get('/status', (_req, res) => {
        res.end('OK');
    });

    // Set up the request logger middleware (to stdout).
    app.use(requestLoggingMiddleware(config));

    const exegesisOptions: ExegesisOptions = {
        controllers: {
            messages: messagesController,
        },
        customFormats: customFormatValidators,
    };
    const exegesisMiddleware = await exegesisExpressMiddleware(API_SPEC, exegesisOptions);

    // Prepare and serve the API spec document and the Swagger documentation page
    const openApiDoc = await refParser.bundle(API_SPEC, { dereference: { circular: false } });
    app.get('/openapi.yaml', (_req, res) => {
        res.end(yaml.safeDump(openApiDoc));
    });
    app.get(['/', '/index.html'], (_req, res) => {
        res.end(SWAGGER_HTML);
    });
    app.use(express.static(pathToSwaggerUi));

    app.use(exegesisMiddleware);

    app.use((_req, res) => {
        res.status(404).json({ message: `Not found` });
    });

    app.use(
        (
            err: Error | ValidationError,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction
        ) => {
            log.error(`Error: ${getCodeFromError(err)} ${err.message}`);
            res.status(getCodeFromError(err)).json({
                message: `Error: ${getCodeFromError(err)} ${err.message}`,
                errors: isValidationError(err) ? err.errors.map(error => error.message) : undefined,
            });
        }
    );

    if (config.env !== 'test') {
        /* istanbul ignore next */
        app.listen(config.port, () => {
            log.info(`Listening at ${config.port}.`);
        });
    }

    return app;
}

if (require.main === module) {
    /* istanbul ignore next */
    Promise.resolve(createServer()).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
