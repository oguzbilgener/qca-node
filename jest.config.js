const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
    preset: '@shelf/jest-mongodb', // ts-jest
    transform: tsjPreset.transform,
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    // Can't use a globalSetup file when there's a preset.
    // This PR is still open at the time of this commit:
    // https://github.com/facebook/jest/pull/8751
};
