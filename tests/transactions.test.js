const request = require("supertest");
const app = require("../app"); // Import the Express app
const mongoose = require("mongoose");

// Sample transaction data
let transactionId = ""; // To store the created transaction ID
const testTransaction = {
  amount: 100,
  type: "expense",
  category: "Food",
  description: "Lunch at a restaurant",
  date: "2025-03-10",
  tags: ["Food", "Lunch"],
};

// Authenticate user before running tests
let authToken = "";
beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email: "testuser@example.com", // Make sure this user exists in your DB
      password: "password123",
    });

  authToken = res.body.token; // Store the authentication token
});

// **Test 1: Create a Transaction**
test("Should create a new transaction", async () => {
  const res = await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${authToken}`)
    .send(testTransaction);

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("_id");
  transactionId = res.body._id; // Store transaction ID for future tests
});

// **Test 2: Get All Transactions**
test("Should fetch all transactions", async () => {
  const res = await request(app)
    .get("/api/transactions")
    .set("Authorization", `Bearer ${authToken}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// **Test 3: Update a Transaction**
test("Should update a transaction", async () => {
  const updatedTransaction = { amount: 150, description: "Dinner instead" };

  const res = await request(app)
    .put(`/api/transactions/${transactionId}`)
    .set("Authorization", `Bearer ${authToken}`)
    .send(updatedTransaction);

  expect(res.status).toBe(200);
  expect(res.body.amount).toBe(150);
});

// **Test 4: Delete a Transaction**
test("Should delete a transaction", async () => {
  const res = await request(app)
    .delete(`/api/transactions/${transactionId}`)
    .set("Authorization", `Bearer ${authToken}`);

  expect(res.status).toBe(200);
  expect(res.body.message).toBe("Transaction deleted successfully");
});

// Close the database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});
