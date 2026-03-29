const request = require("supertest");
const app = require("../src/server");
const prisma = require("../src/config/prisma");
const bcrypt = require("bcryptjs");
const { registerAndLogin, createUser } = require("./helpers/auth.helper");

let adminToken;

beforeAll(async () => {
  await prisma.blacklistToken.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("12345678", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@example.com",
      password: hash,
      role: "admin",
      is_active: true,
    },
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@example.com", password: "12345678" });

  adminToken = res.body.accessToken;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("User API", () => {

  it("ไม่มี token → 401", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toBe(401);
  });

  it("admin ดู users ได้", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("user ห้ามดู users → 403", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("user ดูตัวเองได้", async () => {
    const { userId, accessToken } = await registerAndLogin();

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("user ห้ามดูคนอื่น", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get("/api/users/99999")
      .set("Authorization", `Bearer ${accessToken}`);

    expect([403, 404]).toContain(res.statusCode);
  });

  it("admin ลบ user ได้", async () => {
    const user = createUser();

    const reg = await request(app)
      .post("/api/auth/register")
      .send(user);

    const res = await request(app)
      .delete(`/api/users/${reg.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("user update ตัวเองได้", async () => {
    const { userId, accessToken } = await registerAndLogin();

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Updated" });

    expect(res.statusCode).toBe(200);
  });

});