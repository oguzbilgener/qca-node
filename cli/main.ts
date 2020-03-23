import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs';
import url from 'url';
import yargs from 'yargs';
import qs from 'qs';
import { DateTime } from 'luxon';

const CLI_0 = 'bin/qca-cli';
const DEFAULT_HOST = 'https://qca-node.bilgener.ca';

export interface ApiMessageCreate {
    content: string;
}

export interface ApiMessage extends ApiMessageCreate {
    id: string;
    createdAt: string;
    updatedAt?: string;
    palindrome: boolean;
}

function validateUrl(input: string) {
    const parsed = url.parse(input);
    return !!parsed.protocol;
}

function printItem(message: ApiMessage, i?: number) {
    const palindromeMsg = message.palindrome
        ? chalk.green('palindrome')
        : chalk.redBright('not a palindrome');
    console.log(
        chalk.grey(
            DateTime.fromISO(message.updatedAt || message.createdAt).toLocaleString(
                DateTime.DATETIME_MED
            )
        ),
        '|',
        `${message.content}`,
        '|',
        palindromeMsg,
        `(${message.id})`
    );
}

function printErrorAndExit(message: string) {
    console.log(chalk.red('Error:'), message);
    process.exit(1);
}

async function request(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: object | undefined
) {
    const response = await fetch(url, {
        method,
        headers:
            method !== 'GET' && method !== 'DELETE'
                ? {
                      'Content-Type': 'application/json',
                  }
                : {},
        redirect: 'follow',
        body: body ? JSON.stringify(body) : undefined,
    });
    try {
        const jsonBody = response.status === 200 ? await response.json() : {};
        return {
            code: response.status,
            body: jsonBody,
        };
    } catch (err) {
        return {
            code: 0,
            body: {},
        };
    }
}

function readStdin(): string {
    try {
        return fs.readFileSync(0, 'utf-8');
    } catch (err) {
        printErrorAndExit(err.message);
        return '';
    }
}

async function get(host: string, id: string) {
    const url = `${host}/v1/messages/${id}`;
    const result = await request(url, 'GET');
    if (result.code === 200) {
        printItem(result.body);
    } else if (result.code === 404) {
        printErrorAndExit('Message not found.');
    } else {
        printErrorAndExit(`HTTP ${result.code}: ${result.body.message}`);
    }
}

async function list(host: string, limit: number | undefined, afterId: string | undefined) {
    const opts = { limit, afterId };
    const url = `${host}/v1/messages?${qs.stringify(opts)}`;

    const result = await request(url, 'GET');
    if (result.code !== 200) {
        printErrorAndExit(`HTTP ${result.code}: ${result.body.message}`);
    }
    console.log(chalk.underline('Messages:'));
    result.body.items.forEach(printItem);
    if (result.body.hasMore && result.body.lastId) {
        console.log('\nThere are more messages available. Load the next page with this command:');
        const args = [
            'list',
            host !== DEFAULT_HOST ? `-H ${host}` : undefined,
            limit ? `-l ${limit}` : undefined,
            `-a ${result.body.lastId}`,
        ]
            .filter(el => !!el)
            .join(' ');
        console.log(`$ ${CLI_0} ${args}`);
    }
}

async function create(host: string, message: string) {
    const url = `${host}/v1/messages`;
    const result = await request(url, 'POST', { content: message });
    if (result.code === 200 && result.body) {
        console.log(chalk.green('Message created.'));
        printItem(result.body);
    } else {
        printErrorAndExit(`HTTP ${result.code}: ${result.body.message || 'Unknown error'}`);
    }
}

async function update(host: string, id: string, newMessage: string) {
    const url = `${host}/v1/messages/${id}`;
    const result = await request(url, 'PUT', { content: newMessage });
    if (result.code === 200 && result.body) {
        console.log(chalk.green('Message updated.'));
        printItem(result.body);
    } else if (result.code === 404) {
        printErrorAndExit('Message not found.');
    } else {
        printErrorAndExit(`HTTP ${result.code}: ${result.body.message || 'Unknown error'}`);
    }
}

async function remove(host: string, id: string) {
    const url = `${host}/v1/messages/${id}`;
    const result = await request(url, 'DELETE');
    if (result.code === 204) {
        console.log(chalk.green('Message removed.'));
    } else if (result.code === 404) {
        printErrorAndExit('Message not found.');
    } else {
        printErrorAndExit(`HTTP ${result.code}: ${result.body.message || 'Unknown error'}`);
    }
}

function getOptions() {
    return yargs
        .reset()
        .strict()
        .usage(
            `A CLI client for the qca-node REST API server.
    Usage: $0 [--host baseUrl] [command]
`
        )
        .option('host', {
            alias: 'H',
            type: 'string',
            describe: 'The API server base URL.',
            default: DEFAULT_HOST,
        })
        .option('limit', {
            alias: 'l',
            type: 'number',
            describe: `Items per page, when retrieving messages. \nExample: $ ${CLI_0} list -l 100`,
        })
        .option('afterId', {
            alias: 'a',
            type: 'string',
            describe: `Retrieve messages after the message with this ID. \nExample: $ ${CLI_0} list -a 5e754399f3b2661d2cf011b5`,
        })
        .option('stdin', {
            boolean: true,
            describe: `Get the message from stdin. \nExample: $ ${CLI_0} create --stdin < file.txt`,
            default: false,
        })
        .command('list', 'List the most recent messages')
        .command('get [id]', 'Get and print a message by the given ID')
        .command('create [message]', 'Create a new message')
        .command('update [id] [message]', 'Update a message')
        .command('remove [id]', 'Remove a message')
        .help('h')
        .alias('h', 'help')
        .demandCommand().argv;
}

async function main() {
    const options = getOptions();
    if (!validateUrl(options.host)) {
        printErrorAndExit('Invalid host URL.');
    }
    const command = options._[0];
    if (!command) {
        printErrorAndExit('No command.');
    }

    if (command === 'list') {
        await list(options.host, options.limit, options.afterId);
    } else if (command === 'get') {
        if (!options.id) {
            printErrorAndExit(
                `Please provide a message ID.\nExample: $ ${CLI_0} get 5e754399f3b2661d2cf011b5`
            );
        }
        await get(options.host, options.id as string);
    } else if (command === 'create') {
        let message: string;
        if (options.stdin) {
            message = readStdin();
        } else {
            if (!options.message) {
                printErrorAndExit(
                    `Please provide a message.\nExample: $ ${CLI_0} create "Hello world!"`
                );
            }
            message = options.message as string;
        }
        await create(options.host, message);
    } else if (command === 'update') {
        if (!options.id) {
            printErrorAndExit(
                `Please provide a message ID.\nExample: $ ${CLI_0} update 5e754399f3b2661d2cf011b5 "Hello world!"`
            );
        }
        let message: string;
        if (options.stdin) {
            message = readStdin();
        } else {
            if (!options.message) {
                printErrorAndExit(
                    `Please provide a message.\nExample: $ ${CLI_0} update 5e754399f3b2661d2cf011b5 "Hello world!"`
                );
            }
            message = options.message as string;
        }
        await update(options.host, options.id as string, message);
    } else if (command === 'remove') {
        if (!options.id) {
            printErrorAndExit(
                `Please provide a message ID.\nExample: $ ${CLI_0} remove 5e754399f3b2661d2cf011b5`
            );
        }
        await remove(options.host, options.id as string);
    }
}

main().catch(err => {
    console.error(`Error: ${err.stack || err}`);
    process.exit(1);
});
