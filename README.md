# ESI Backend

A complete backend implementation for user registration, OTP verification, login, and data storage.

## Features

- User registration with email
- OTP verification via Email
- User authentication with JWT
- CRUD operations for storing numerical data
- Express REST API with MongoDB database

## Setup Instructions

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or cloud instance)
- Email account (for sending OTP emails)

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
   - Rename or copy `.env` file
   - Update with your MongoDB URI and other settings

4. Start the server:

```bash
# Development with nodemon
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/login` - Login user
- `POST /api/auth/resend-otp` - Resend OTP code

### User

- `GET /api/users/me` - Get current user info
- `PUT /api/users/updatedetails` - Update user details

### Data (Numbers)

- `GET /api/data` - Get all data entries for logged in user
- `POST /api/data` - Create a new data entry
- `GET /api/data/:id` - Get single data entry
- `PUT /api/data/:id` - Update data entry
- `DELETE /api/data/:id` - Delete data entry

## Example Requests

### Register User

```
POST /api/auth/register
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "phone": "+919876543210", // optional
  "password": "password123"
}
```

### Verify OTP

```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "userId": "user_id_from_registration_response",
  "otp": "123456"
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Create Data Entry

```
POST /api/data
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "number": 12345,
  "description": "Example number entry"
}
```
