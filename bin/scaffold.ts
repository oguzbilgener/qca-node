const _fetch = require('node-fetch');
const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const shuffle = require('lodash/shuffle');

function loadText(): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            fs.readFile(
                path.resolve(__dirname, '../test/testUtils/lipsum.txt'),
                (err: any, file: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(file.toString());
                    }
                }
            );
        } catch (err) {
            reject(err);
        }
    });
}

function prepareData(input: string) {
    return input.replace(/\\n/g, '').split('. ');
}

async function getShuffledMessages() {
    return shuffle(prepareData(await loadText()));
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
            required: true,
        })
        .help('h')
        .alias('h', 'help').argv;
}

async function main() {
    const options = getOptions();
    const url = options.host;
    const messages = await getShuffledMessages();
    let ok = 0;
    let notOk = 0;
    for (const message of messages) {
        const response = await _fetch(`${url}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message,
            }),
        });
        if (response.status === 200) {
            ok++;
        } else {
            notOk++;
        }
    }
    if (ok === messages.length) {
        console.log(`Successfully created ${ok} messages.`);
    } else if (ok > 0) {
        console.log(`Success: ${ok}, failure: ${notOk}`);
    } else {
        console.log(`Failed to create any messages at all.`);
    }
}

main().catch(err => {
    console.error(`Error: `, err);
    process.exit(1);
});
