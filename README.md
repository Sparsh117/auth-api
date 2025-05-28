# Auth API Node.js

A RESTful API for user authentication using Node.js, Express, MongoDB, and JWT.

## Features

- User registration and login
- JWT-based authentication
- Protected routes
- Password hashing
- Token expiration
- Logout functionality

## Prerequisites

- Node.js (v14 or higher)
- MongoDB

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/auth-api
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

4. Start the server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### POST /api/auth/register
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/auth/login
Login with existing credentials
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### GET /api/auth/dashboard
Protected route - requires JWT token in Authorization header
```
Authorization: Bearer <your_jwt_token>
```

### POST /api/auth/logout
Logout (clears token on client-side)

## Security Features

- Password hashing using bcrypt
- JWT token expiration
- Protected routes middleware
- MongoDB injection protection
- CORS enabled 