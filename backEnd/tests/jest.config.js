module.exports = {
  testEnvironment: "node",

  // Jest 27 cannot resolve Sharp's native package export subpath.
  moduleNameMapper: {
    "^@img/sharp-([^/]+)/sharp\\.node$":
      "<rootDir>/../node_modules/@img/sharp-$1/lib/sharp-$1.node",
  },

  testMatch: ["**/tests/**/*.test.js"],

  collectCoverage: true,

  coverageDirectory: "coverage",

  collectCoverageFrom: [
    "src/modules/**/*.js",
    "src/utils/**/*.js",
    "!**/node_modules/**"
  ]
};
