import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

export default {
    // input: './main2.js',
    input: './main.ts',
    output: {
        file: '../bin/qca-cli',
        format: 'cjs',
        name: 'qca_cli',
    },
    plugins: [
        typescript({
            module: 'es2015',
        }),
        resolve({
            main: false,
        }),
        commonjs({
            include: ['node_modules/**'],
            sourceMap: false,
        }),
    ],
    onwarn(message) {
        if (message.code === 'UNRESOLVED_IMPORT') {
            console.log(`Could not resolve module "${message.source}"`);
        }
    },
};
