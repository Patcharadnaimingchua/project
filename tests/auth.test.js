const request = require("supertest");
const app = require("../src/server");
const prisma = require("../src/config/prisma");
const { createUser, registerAndLogin } = require("./helpers/auth.helper");

beforeAll(async () => {
  await prisma.blacklistToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth API", () => {

  // REGISTER
  it("สมัครสำเร็จ", async () => {
    const user = createUser();

    const res = await request(app).post("/api/auth/register").send(user);

    expect(res.statusCode).toBe(201);
  });

  it("สมัครซ้ำ", async () => {
    const user = createUser();

    await request(app).post("/api/auth/register").send(user);

    const res = await request(app).post("/api/auth/register").send(user);

    expect(res.statusCode).toBe(409);
  });

  it("สมัคร invalid", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "bad", password: "123" });

    expect(res.statusCode).toBe(400);
  });

  // LOGIN
  it("login สำเร็จ", async () => {
    const user = createUser();

    await request(app).post("/api/auth/register").send(user);

    const res = await request(app).post("/api/auth/login").send(user);

    expect(res.statusCode).toBe(200);
  });

  it("password ผิด", async () => {
    const user = createUser();

    await request(app).post("/api/auth/register").send(user);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong" });

    expect(res.statusCode).toBe(401);
  });

  // ME
  it("me สำเร็จ", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("me ไม่มี token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });

  // REFRESH
  it("refresh สำเร็จ", async () => {
    const { refreshToken } = await registerAndLogin();

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
  });

  // LOGOUT
  it("logout สำเร็จ", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("logout แล้ว token ใช้ไม่ได้", async () => {
    const { accessToken } = await registerAndLogin();

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(401);
  });

});