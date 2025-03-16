const request = require("supertest");
const app = require("../app"); // Import your Express app

describe("Authentication API", () => {
  let testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "Test@1234"
  };

  test("Should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);
      
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
  });

  test("Should login an existing user", async () => {
    jest.setTimeout(10000);
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
