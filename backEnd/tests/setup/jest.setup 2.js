const { connect, close } = require("./mongodb");

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await close();
});