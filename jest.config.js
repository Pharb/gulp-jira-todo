module.exports = {
    testRunner: 'jest-circus/runner',
    testEnvironment: 'node',
    testRegex: '.*\\.test\\.js$',
    moduleFileExtensions: ['js'],
    testPathIgnorePatterns: ['/node_modules/', '/.cache/'],
    watchPathIgnorePatterns: ['/.cache/'],
    collectCoverageFrom: ['**/*.{js}', '!**/*.test.{js}'],
    coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
    coverageDirectory: 'coverage',
    coverageReporters: ['html', 'cobertura', 'text-summary'],
    cacheDirectory: '.cache/jest',
};
