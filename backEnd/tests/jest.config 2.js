module.exports = {
  testEnvironment: "node",

  testMatch: ["**/tests/**/*.test.js"],

  collectCoverage: true,

  coverageDirectory: "coverage",

  collectCoverageFrom: [
    "src/modules/**/*.js",
    "src/utils/**/*.js",
    "!**/node_modules/**"
  ]
};