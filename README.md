# Personal Finance Tracker API

A secure RESTful API for managing personal finances. This system allows users to track income and expenses, set budgets, create and track savings goals, generate detailed financial reports (including multi‑currency support), and view role‑based dashboards.

## Overview

This API was built as part of the AF Assignment 01 project. It supports:

- **User Roles & Authentication:** Secure registration, login, and role‑based access control using JWT.
- **Expense & Income Tracking:** CRUD operations for transactions (including recurring transactions and custom tagging).
- **Budget Management:** Set budgets (general or category‑specific) with notifications when spending nears or exceeds limits; also provides adjustment recommendations.
- **Financial Reports:** Generate reports for spending trends over custom date ranges; supports filtering by category and tags and includes multi‑currency conversion.
- **Notifications & Alerts:** Sends alerts for budget warnings, recurring transactions, and goal milestones.
- **Goals & Savings Tracking:** Users can set savings goals and benefit from automatic allocation of a percentage (or fixed amount) of income toward their goals.
- **Multi‑Currency Support:** Transactions are converted to a base currency (USD) and reported in the user’s preferred currency.
- **Role‑Based Dashboards:** Separate dashboards provide an admin overview of system activity and personalized user dashboards showing recent transactions, budgets, and goals.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **Authentication:** JSON Web Tokens (JWT)
- **Security:** express‑mongo‑sanitize, express‑rate‑limit, express‑validator
- **Documentation:** Postman collection 
- **Testing:** (Unit and integration tests with Jest/Supertest to be added)

## Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/SE1020-IT2070-OOP-DSA-25/project-R-Tharanka.git
cd project-R-Tharanka
```
## Install Dependencies

```bash
npm install
```
# Set Up Environment Variables

Create a `.env` file in the root directory and add:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

```
Start the Server

```bash
npm run dev
```

The API will be running at [http://localhost:5000/](http://localhost:5000/).

# API Documentation

The API is documented via a Postman collection included in the repository. (See `Finance Tracker System API.postman_collection.json`).


# Acknowledgements

This project was developed based on the AF Assignment for the BSc (Hons) in Information Technology at SLIIT.

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xIbq4TFL)
