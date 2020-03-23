module.exports = api => {
    const isTest = api.env('test');
    return {
        presets: [
            [
                '@babel/env',
                { targets: { node: '12' }, modules: 'commonjs' /*isTest ? 'commonjs' : false*/ },
            ],
            '@babel/typescript',
        ],
        plugins: [
            '@babel/proposal-class-properties',
            '@babel/proposal-optional-chaining',
            '@babel/proposal-nullish-coalescing-operator',
        ],
    };
};
