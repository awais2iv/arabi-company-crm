# Avaya Backend

A production-ready backend API built with Node.js, Express, and MongoDB. This project follows the same architecture patterns as FlexiPay backend.

## Features

- ✅ **Authentication & Authorization**: JWT-based authentication with refresh tokens
- ✅ **User Management**: Complete user CRUD operations with role-based access
- ✅ **Email Verification**: OTP-based email verification system
- ✅ **Security**: Password hashing with bcrypt, HTTP-only cookies, CORS protection
- ✅ **Logging**: Structured logging with Pino
- ✅ **Error Handling**: Centralized error handling with custom error classes
- ✅ **MongoDB Integration**: Mongoose ODM with connection management
- ✅ **Redis Support**: Optional Redis integration for caching and sessions
- ✅ **Modular Architecture**: Clean separation of concerns (routes, controllers, services, models)

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Logging**: Pino + Pino-pretty
- **Caching**: Redis (ioredis)
- **Email**: Nodemailer
- **Validation**: Custom middleware
- **Development**: Nodemon

## Project Structure

```
backend_avaya/
├── src/
│   ├── config/          # Configuration files (Redis, etc.)
│   ├── controllers/     # Request handlers
│   ├── db/              # Database connection
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper utilities
│   ├── app.js           # Express app setup
│   ├── server.js        # Server entry point
│   └── constants.js     # App constants
├── public/              # Static files
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md           # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or remote)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000`

### Production

```bash
npm start
```

## Environment Variables

See `.env.example` for all required environment variables:

- `MONGO_DB_URI`: MongoDB connection string
- `PORT`: Server port (default: 8000)
- `ACCESS_TOKEN_SECRET`: JWT access token secret
- `REFRESH_TOKEN_SECRET`: JWT refresh token secret
- `OTP_TOKEN_SECRET`: OTP token secret
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origins
- `SMTP_USER`: Email service username
- `SMTP_PASS`: Email service password

## API Endpoints

### Health Check
- `GET /api/v1/health` - Service health status

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout (protected)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/resend-otp` - Resend OTP
- `GET /api/v1/auth/check-email` - Check email availability

### Users
- `GET /api/v1/users/me` - Get current user (protected)
- `PATCH /api/v1/users/update-profile` - Update profile (protected)
- `POST /api/v1/users/change-password` - Change password (protected)
- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:userId` - Get user by ID (admin only)

## Architecture

This backend follows the same architectural patterns as FlexiPay:

### Core Components

1. **Utils**: Reusable utilities (logger, error handling, async wrapper)
2. **Middlewares**: Request processing (auth, validation, error handling)
3. **Models**: Mongoose schemas with business logic methods
4. **Controllers**: Request handlers with business logic
5. **Routes**: API endpoint definitions
6. **Services**: Complex business logic and external integrations
7. **Config**: Configuration management

### Key Patterns

- **Async Error Handling**: All async operations wrapped with asyncHandler
- **Centralized Error Handling**: Custom ApiError class with global error handler
- **Response Standardization**: ApiResponse class for consistent responses
- **JWT Authentication**: Refresh token rotation with HTTP-only cookies
- **Middleware Pipeline**: Modular middleware composition
- **Environment-based Configuration**: dotenv with validation

## Development

### Adding New Features

1. Create model in `src/models/`
2. Create controller in `src/controllers/`
3. Create routes in `src/routes/`
4. Register routes in `src/app.js`
5. Add services if needed in `src/services/`

### Code Style

- ES Modules (import/export)
- Async/await for asynchronous operations
- Consistent error handling with ApiError
- Comprehensive logging
- Comments for TODO items and future business logic

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- HTTP-only cookies for tokens
- CORS protection
- Rate limiting (TODO)
- Input validation (TODO)
- SQL injection protection via Mongoose

## TODO / Future Enhancements

- [ ] Add rate limiting middleware
- [ ] Implement comprehensive input validation
- [ ] Add Swagger/OpenAPI documentation
- [ ] Add unit and integration tests
- [ ] Add database migrations
- [ ] Implement file upload handling
- [ ] Add WebSocket support
- [ ] Add pagination helpers
- [ ] Add search and filtering utilities
- [ ] Implement email templates
- [ ] Add monitoring and metrics
- [ ] Add Docker support

## License

ISC
