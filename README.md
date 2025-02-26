# Personal Finance Tracker API (In Development)  
A secure RESTful API for managing personal finances, tracking expenses, setting budgets, and generating financial reports.  

## Tech Stack  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Atlas or Local)  
- **Authentication:** JWT (to be implemented)  
- **Testing:** Jest, Supertest (to be implemented)  
- **Documentation:** Postman  

---

## Project Status  
 **Current Progress:**  
 Project setup completed (Express.js, MongoDB connection, environment configuration).  
 Basic Express server running on `http://localhost:5000/`.  
 MongoDB connected successfully.  
 **Next Steps:** Implement user authentication (JWT-based login, registration, and role management).  

---
##  Dependencies  
This project uses the following NPM packages:  

### ** Main Dependencies (Required for Production)**
| Package          | Version | Description |
|-----------------|---------|-------------|
| `express`       | latest  | Web framework for Node.js |
| `mongoose`      | latest  | MongoDB ODM for Node.js |
| `dotenv`        | latest  | Loads environment variables from `.env` |
| `cors`          | latest  | Enables Cross-Origin Resource Sharing |
| `morgan`        | latest  | HTTP request logger for debugging |
| `jsonwebtoken`  | latest  | JWT-based authentication |
| `bcryptjs`      | latest  | Secure password hashing |

### ** Dev Dependencies (For Development & Testing)**
| Package      | Version | Description |
|-------------|---------|-------------|
| `nodemon`   | latest  | Auto-restarts the server on file changes |
| `jest`      | latest  | JavaScript testing framework |
| `supertest` | latest  | API testing library for HTTP assertions |

---

##  Setup Instructions  

### 1️ Clone the Repository  
```bash
git clone https://github.com/SE1020-IT2070-OOP-DSA-25/project-R-Tharanka.git
cd project-R-Tharanka
```

### 2 Install Dependencies
```bash
npm install
```
### 3 Set Up Environment Variables
Create a .env file in the root directory and add:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
### 4 Start the Server
``` 
npm run dev
```
The API should be running at http://localhost:5000/

---

## Testing (To Be Implemented)
Unit and integration tests will be added later using Jest and Supertest.

---

## API Endpoints (Coming Soon)
A full list of API routes will be documented once implemented.

---



[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xIbq4TFL)
