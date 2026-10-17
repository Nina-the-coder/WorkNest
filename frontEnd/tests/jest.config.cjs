const path = require("node:path");

// Reuse the repository's existing Jest/Babel/jsdom installation.
const backendModules = path.resolve(__dirname, "../../backEnd/node_modules");

module.exports = {
  rootDir: "..",
  testEnvironment: path.join(backendModules, "jest-environment-jsdom"),
  testMatch: ["<rootDir>/tests/**/*.test.jsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.cjs"],
  transform: {
    "\\.[jt]sx?$": [
      path.join(backendModules, "babel-jest"),
      {
        babelrc: false,
        configFile: false,
        presets: [[path.join(backendModules, "@babel/preset-react"), { runtime: "automatic" }]],
        plugins: [path.join(backendModules, "@babel/plugin-transform-modules-commonjs")],
      },
    ],
  },
  moduleNameMapper: {
    // Jest 27 predates the router's conditional package exports.
    "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js",
    "^react-router$": "<rootDir>/node_modules/react-router/dist/development/index.js",
    "^react-router/dom$": "<rootDir>/node_modules/react-router/dist/development/dom-export.js",
    "\\.(css|svg)$": "<rootDir>/tests/staticMock.cjs",
  },
  clearMocks: true,
};
