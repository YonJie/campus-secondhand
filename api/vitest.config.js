const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.js'],
    setupFiles: ['__tests__/setup.js'],
    testTimeout: 30000,
  },
});
