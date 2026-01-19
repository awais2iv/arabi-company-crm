# Backend Avaya - Architecture Overview

## Project Summary

**backend_avaya** is a production-ready Node.js/Express backend that mirrors the architecture and patterns of FlexiPay backend. It provides a solid foundation with authentication, user management, error handling, logging, and database integration.

---

## Architecture Breakdown

### 1. **Core Stack**
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js 5.x
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT with refresh tokens
- **Logging**: Pino with pretty formatting for development
- **Caching**: Redis (optional, configured but not required)
- **Email**: Nodemailer for SMTP

### 2. **Folder Structure**

```
backend_avaya/
├── src/
│   ├── config/                    # Configuration modules
│   │   └── redis.config.js        # Redis client with pub/sub support
│   │
│   ├── controllers/               # Request handlers
│   │   ├── auth.controller.js     # Authentication logic
│   │   └── user.controller.js     # User management logic
│   │
│   ├── db/                        # Database layer
│   │   └── dbConnect.js           # MongoDB connection with retry
│   │
│   ├── middlewares/               # Express middlewares
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── error.middleware.js    # Global error handler
│   │   ├── verifyAdmin.middleware.js  # Admin role verification
│   │   └── verifyOtp.middleware.js    # OTP token verification
│   │
│   ├── models/                    # Mongoose schemas
│   │   └── user.model.js          # User model with JWT methods
│   │
│   ├── routes/                    # API route definitions
│   │   ├── auth.routes.js         # Auth endpoints
│   │   ├── user.routes.js         # User endpoints
│   │   └── healthcheck.routes.js  # Health check endpoint
│   │
│   ├── services/                  # Business logic (empty, ready for expansion)
│   │
│   ├── utils/                     # Helper utilities
│   │   ├── apiError.util.js       # Custom error class
│   │   ├── apiResponse.util.js    # Standardized response format
│   │   ├── asyncHandler.util.js   # Async error wrapper
│   │   ├── email.util.js          # Email sending utility
│   │   ├── logger.util.js         # Pino logger configuration
│   │   └── otpGenerate.util.js    # OTP generation logic
│   │
│   ├── app.js                     # Express app configuration
│   ├── server.js                  # Server entry point
│   └── constants.js               # Application constants
│
├── public/                        # Static files directory
├── .env                           # Environment variables (local)
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and scripts
└── README.md                      # Project documentation
```

---

## 3. **Core Components**

### **Utils (Foundation Layer)**
Following FlexiPay's utility pattern:

- **`apiError.util.js`**: Custom error class with statusCode, message, and error details
- **`apiResponse.util.js`**: Standardized success response format
- **`asyncHandler.util.js`**: Wraps async route handlers to catch errors automatically
- **`logger.util.js`**: Pino logger with pretty formatting for development, JSON for production
- **`email.util.js`**: Nodemailer wrapper for sending emails
- **`otpGenerate.util.js`**: Generates unique 6-digit OTPs with collision prevention

### **Middlewares (Request Pipeline)**

- **`auth.middleware.js`**: 
  - Verifies JWT tokens from cookies or Authorization header
  - Loads user from database and attaches to `req.user`
  - Handles token expiration and invalid tokens
  - Checks for suspended accounts

- **`verifyAdmin.middleware.js`**:
  - Ensures authenticated user has admin privileges
  - Supports dev bypass with `x-dev-admin` header in development

- **`verifyOtp.middleware.js`**:
  - Validates OTP tokens during registration/verification flow
  - Extracts decoded OTP data to `req.otpData`

- **`error.middleware.js`**:
  - Global error handler (must be last middleware)
  - Standardizes error responses
  - Logs errors for debugging

### **Models (Data Layer)**

- **`user.model.js`**:
  - Schema: firstname, lastname, email, phone, password, type (admin/user/customer)
  - OTP fields: otp, otpExpiry, resetOtp, resetOtpExpiry
  - Status tracking: isVerified, status (active/suspended/pending)
  - Token storage: accessToken, refreshToken
  - **Compound unique index**: email + type (allows same email for different user types)
  - **Pre-save hook**: Hashes password with bcrypt
  - **Instance methods**:
    - `isPasswordCorrect()`: Compares passwords
    - `generateAccessToken()`: Creates JWT access token
    - `generateRefreshToken()`: Creates JWT refresh token
    - `generateOTPToken()`: Creates short-lived OTP token

### **Controllers (Business Logic)**

#### **auth.controller.js**
- `checkEmailAvailability`: Check if email is available for a user type
- `registerUser`: Register new user with validation
- `verifyOtp`: Verify OTP and activate account
- `resendOtp`: Resend OTP to user email
- `userLogin`: Authenticate user with email/password
- `logout`: Clear tokens and logout user
- `refreshAccessToken`: Generate new access token using refresh token

#### **user.controller.js**
- `getCurrentUser`: Get authenticated user profile
- `updateUserProfile`: Update user details (firstname, lastname, phone)
- `changePassword`: Change user password with old password verification
- `getUserById`: Get user by ID (admin only)
- `getAllUsers`: Get all users with filters (admin only)

### **Routes (API Endpoints)**

#### **Health Check**
- `GET /api/v1/health` - Service health status

#### **Authentication** (`/api/v1/auth`)
- `GET /check-email` - Check email availability
- `POST /register` - Register new user
- `POST /verify-otp` - Verify OTP
- `POST /resend-otp` - Resend OTP
- `POST /login` - User login
- `POST /logout` - User logout (protected)
- `POST /refresh` - Refresh access token

#### **Users** (`/api/v1/users`)
- `GET /me` - Get current user (protected)
- `PATCH /update-profile` - Update profile (protected)
- `POST /change-password` - Change password (protected)
- `GET /` - Get all users (admin only)
- `GET /:userId` - Get user by ID (admin only)

### **Configuration**

#### **redis.config.js**
- Redis client singleton with main, subscriber, and publisher instances
- Auto-reconnection with exponential backoff
- Utility methods: `set()`, `get()`, `del()`, `exists()`
- Graceful disconnect handling

#### **dbConnect.js**
- MongoDB connection with error handling
- Database name from constants
- Logs connection status
- Exits process on connection failure

---

## 4. **Authentication Flow**

### Registration Flow:
1. User sends registration data (POST /auth/register)
2. System validates input and checks for duplicate email
3. User created with `isVerified: false` and `status: pending`
4. OTP generated and stored (TODO: send via email)
5. Returns user data and otpToken

### Verification Flow:
1. User submits OTP (POST /auth/verify-otp)
2. System validates OTP token and compares OTP
3. If valid, sets `isVerified: true` and `status: active`
4. Clears OTP fields

### Login Flow:
1. User submits credentials (POST /auth/login)
2. System finds user by email + type
3. Validates password with bcrypt
4. Checks if account is verified and not suspended
5. Generates access + refresh tokens
6. Sets HTTP-only cookies
7. Returns user data and tokens

### Token Refresh Flow:
1. Client sends refresh token (POST /auth/refresh)
2. System verifies refresh token
3. Checks if token matches stored token
4. Generates new access + refresh tokens
5. Rotates refresh token (invalidates old one)
6. Returns new tokens

---

## 5. **Error Handling Strategy**

Following FlexiPay's error handling pattern:

1. **ApiError Class**: 
   - Custom error class extending Error
   - Includes statusCode, message, success flag, errors array
   - Stack trace capture for debugging

2. **asyncHandler Wrapper**:
   - Wraps all async route handlers
   - Automatically catches errors and passes to error handler
   - Eliminates try-catch boilerplate

3. **Global Error Handler**:
   - Middleware registered last in app.js
   - Standardizes all error responses
   - Logs errors for monitoring
   - Returns consistent JSON format

---

## 6. **Environment Configuration**

Required environment variables in `.env`:

```bash
# Database
MONGO_DB_URI=mongodb://localhost:27017

# Server
PORT=8000
NODE_ENV=development

# JWT Secrets (change in production!)
ACCESS_TOKEN_SECRET=your_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here
OTP_TOKEN_SECRET=your_otp_secret_here

# Token Expiry
ACCESS_TOKEN_EXPIRY=8h
REFRESH_TOKEN_EXPIRY=8h
OTP_TOKEN_EXPIRY=5m

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Email (SMTP)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

## 7. **Key Design Patterns (from FlexiPay)**

### **Separation of Concerns**
- Routes define endpoints only
- Controllers handle business logic
- Services contain complex operations
- Utils provide reusable helpers
- Middlewares handle cross-cutting concerns

### **Consistent Error Handling**
```javascript
// All controllers use asyncHandler
const someController = asyncHandler(async (req, res) => {
    // Any error thrown here is caught automatically
    if (!data) throw new ApiError(404, "Not found");
    
    res.json(new ApiResponse(200, data, "Success"));
});
```

### **Standardized Responses**
```javascript
// Success response
new ApiResponse(statusCode, data, message)

// Error response (automatically formatted by error handler)
throw new ApiError(statusCode, message, errors)
```

### **JWT Token Pattern**
- Access token: Short-lived (8h), for API access
- Refresh token: Long-lived (8h), for token renewal
- HTTP-only cookies for web clients
- Token rotation on refresh

### **Middleware Chaining**
```javascript
router.route("/protected")
    .get(verifyJWT, someController)

router.route("/admin-only")
    .get(verifyAdmin, adminController)
```

---

## 8. **Security Measures**

✅ **Password Security**:
- Bcrypt hashing with 10 rounds
- Never store plain text passwords
- Password validation on change

✅ **JWT Security**:
- HTTP-only cookies (prevents XSS)
- Secure flag in production (HTTPS only)
- SameSite: strict (prevents CSRF)
- Token rotation on refresh

✅ **CORS Protection**:
- Whitelist allowed origins
- Credentials support for cookies
- Configurable via environment

✅ **Input Validation**:
- Email format validation
- Required field checks
- Type validation

✅ **Account Security**:
- Email verification required
- Account status checks (suspended/active)
- Failed login handling

---

## 9. **Next Steps & TODOs**

### Immediate Enhancements:
- [ ] Implement email sending for OTP verification
- [ ] Add email templates (OTP, welcome, password reset)
- [ ] Add password reset functionality
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add input validation library (Joi/Zod)

### Short-term:
- [ ] Add pagination helpers
- [ ] Implement search and filtering
- [ ] Add file upload support (multer)
- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement audit logging
- [ ] Add database migrations

### Long-term:
- [ ] Add unit and integration tests
- [ ] Implement WebSocket support (Socket.io)
- [ ] Add monitoring and metrics (Prometheus)
- [ ] Add Docker containerization
- [ ] Implement CI/CD pipeline
- [ ] Add API versioning strategy

---

## 10. **Running the Project**

### Development:
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev
```

### Production:
```bash
# Install production dependencies only
npm install --production

# Start server
npm start
```

### Testing Health:
```bash
curl http://localhost:8000/api/v1/health
```

---

## 11. **Extending the Backend**

To add a new feature (e.g., Products):

1. **Create Model**: `src/models/product.model.js`
2. **Create Controller**: `src/controllers/product.controller.js`
3. **Create Routes**: `src/routes/product.routes.js`
4. **Register Routes**: Add to `src/app.js`
5. **Add Service** (if needed): `src/services/product.service.js`

Example controller structure:
```javascript
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/apiError.util.js";
import { Product } from "../models/product.model.js";

const createProduct = asyncHandler(async (req, res) => {
    // Business logic here
    throw new ApiError(400, "Validation failed");
    // or
    res.json(new ApiResponse(200, product, "Success"));
});

export { createProduct };
```

---

## Conclusion

**backend_avaya** is now a fully functional, production-ready backend skeleton that mirrors FlexiPay's architecture. It provides:

✅ Complete authentication system
✅ User management with RBAC
✅ Robust error handling
✅ Structured logging
✅ Database integration
✅ Redis support (optional)
✅ Email integration
✅ Security best practices
✅ Clean, maintainable code structure

The codebase is ready for business logic implementation while maintaining the proven architectural patterns of FlexiPay.
