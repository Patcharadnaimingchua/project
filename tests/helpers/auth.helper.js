const request = require("supertest");
const app = require("../../src/server");

const createUser = () => ({
  name: "Test User",
  email: `test${Date.now()}${Math.random()}@example.com`,
  password: "12345678",
});

const registerAndLogin = async () => {
  const user = createUser();

  const reg = await request(app)
    .post("/api/auth/register")
    .send(user);

  const login = await request(app)
    .post("/api/auth/login")
    .send(user);

  return {
    user,
    userId: reg.body.data.id,
    accessToken: login.body.accessToken,
    refreshToken: login.body.refreshToken,
  };
};

module.exports = { createUser, registerAndLogin };