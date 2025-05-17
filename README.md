# Personal Finance Tracker API

A comprehensive and secure RESTful API for personal finance management. This system provides a robust platform for users to effectively track income and expenses, set and manage budgets, create and monitor savings goals, generate detailed financial reports with multi-currency support, and access personalized role-based dashboards for complete financial oversight.

## Overview

This API was developed as a comprehensive financial management solution as part of the AF Assignment 01 project. Built with security, scalability, and user experience in mind, the system offers a full suite of features to help users take control of their finances. It supports:

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
- **Testing:** Jest, Supertest

## Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/R-Tharanka/Finance-Tracker-API.git
cd Finance-Tracker-API
```
### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

Create a `.env` file in the root directory and add:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Start the Server

```bash
npm run dev
```

The API will be running at [http://localhost:5000/](http://localhost:5000/).

### Run Tests

```bash
npm test
```

## API Documentation

The API is documented via a Postman collection included in the repository. (See `Finance Tracker System API.postman_collection.json`).

## Project Structure

```
├── app.js                             # Express application setup
├── Finance Tracker System API.postman_collection.json  # API documentation
├── package.json                       # Project dependencies and scripts
├── server.js                          # Server initialization and scheduled tasks
├── config/                            # Configuration files
│   └── logger.js                      # Logging configuration
├── controllers/                       # Route controllers
│   ├── adminController.js             # Admin functionality
│   ├── authController.js              # Authentication
│   ├── budgetController.js            # Budget management
│   ├── categoryController.js          # Categories
│   ├── dashboardController.js         # Dashboard data
│   ├── financialReportsController.js  # Financial reports
│   ├── goalController.js              # Savings goals
│   ├── notificationController.js      # User notifications
│   ├── savingsController.js           # Savings management
│   ├── spendingLimitController.js     # Spending limits
│   ├── transactionController.js       # Transactions
│   └── userController.js              # User management
├── middlewares/                       # Custom middleware
│   └── authMiddleware.js              # Authentication middleware
├── models/                            # MongoDB models
│   ├── AdminLog.js                    # Admin activity logging
│   ├── Budget.js                      # Budget data
│   ├── Category.js                    # Transaction categories
│   ├── Goal.js                        # Savings goals
│   ├── Notification.js                # User notifications
│   ├── SpendingLimit.js               # Spending limits
│   ├── Transaction.js                 # Financial transactions
│   └── User.js                        # User accounts
├── routes/                            # API routes
│   ├── adminRoutes.js                 # Admin endpoints
│   ├── authRoutes.js                  # Authentication endpoints
│   ├── budgetRoutes.js                # Budget endpoints
│   ├── categoryRoutes.js              # Category endpoints
│   ├── dashboardRoutes.js             # Dashboard endpoints
│   ├── financialReports.js            # Reports endpoints
│   ├── goalRoutes.js                  # Goals endpoints
│   ├── notificationRoutes.js          # Notification endpoints
│   ├── spendingLimitRoutes.js         # Spending limit endpoints
│   ├── transactionRoutes.js           # Transaction endpoints
│   └── userRoutes.js                  # User management endpoints
├── tests/                             # Test suites
│   ├── auth.test.js                   # Authentication tests
│   ├── budgets.test.js                # Budget tests
│   ├── dashboard.test.js              # Dashboard tests
│   ├── transactions.test.js           # Transaction tests
│   └── users.test.js                  # User tests
└── utils/                             # Utility functions
    └── currencyConverter.js           # Currency conversion utility
```

## API Endpoints

- **Auth:** `/api/auth` - User registration and login
- **Transactions:** `/api/transactions` - Manage income and expenses
- **Budgets:** `/api/budgets` - Budget management
- **Categories:** `/api/categories` - Transaction categories
- **Goals:** `/api/goals` - Savings goals
- **Reports:** `/api/reports` - Financial reports
- **Dashboard:** `/api/dashboard` - User and admin dashboards
- **Notifications:** `/api/notifications` - User alerts
- **Users:** `/api/users` - User management
- **Admin:** `/api/admin` - Admin-specific endpoints

## Acknowledgements

This project was developed based on the AF Assignment for the BSc (Hons) in Information Technology at SLIIT.
