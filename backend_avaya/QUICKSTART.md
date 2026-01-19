# Quick Start Guide - Backend Avaya

Get up and running with backend_avaya in 5 minutes.

## Prerequisites

- **Node.js** v18+ installed
- **MongoDB** running locally or remote connection string
- **npm** or **yarn** package manager

## Step 1: Install Dependencies

```bash
cd backend_avaya
npm install
```

This installs:
- express, mongoose, jwt, bcrypt
- pino (logger), nodemailer (email)
- cors, cookie-parser, morgan
- and more...

## Step 2: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Minimum required configuration:**
```env
MONGO_DB_URI=mongodb://localhost:27017
PORT=8000
ACCESS_TOKEN_SECRET=your_unique_secret_here
REFRESH_TOKEN_SECRET=your_unique_refresh_secret_here
OTP_TOKEN_SECRET=your_unique_otp_secret_here
```

💡 **Tip**: Generate secure secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Start the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

You should see:
```
✅ MongoDB Server Connected
✅ Server is running at port 8000 on all network interfaces
```

## Step 4: Test the API

### Health Check:
```bash
curl http://localhost:8000/api/v1/health
```

Response:
```json
{
  "statusCode": 200,
  "data": {
    "status": "OK",
    "timestamp": "2026-01-18T10:30:00.000Z",
    "uptime": 5.123,
    "environment": "development"
  },
  "message": "Service is healthy",
  "success": true
}
```

### Register a User:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "type": "user"
  }'
```

### Check Email Availability:
```bash
curl "http://localhost:8000/api/v1/auth/check-email?email=john@example.com&type=user"
```

### Login:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123",
    "type": "user"
  }'
```

This returns:
```json
{
  "statusCode": 200,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

### Get Current User (Protected Route):
```bash
# Use the accessToken from login
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Step 5: Using Postman

1. Import these endpoints into Postman:
   - `POST /api/v1/auth/register`
   - `POST /api/v1/auth/login`
   - `GET /api/v1/users/me`

2. For protected routes:
   - Set Authorization header: `Bearer <your_token>`
   - Or use cookies if testing in browser

## Common Tasks

### Add a New Admin User (via MongoDB):
```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  firstname: "Admin",
  lastname: "User",
  email: "admin@example.com",
  password: "$2b$10$...", // Hash the password first
  type: "admin",
  isVerified: true,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use the registration endpoint and manually update:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { type: "admin", isVerified: true, status: "active" } }
)
```

### Enable Debug Logging:
```bash
# In .env
LOG_LEVEL=debug
```

### Test Admin Routes:
```bash
# Login as admin first, then:
curl http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

## Project Structure at a Glance

```
backend_avaya/
├── src/
│   ├── config/          # Redis, services config
│   ├── controllers/     # auth, user controllers
│   ├── db/              # MongoDB connection
│   ├── middlewares/     # auth, error handlers
│   ├── models/          # User model
│   ├── routes/          # API routes
│   ├── services/        # Business logic (empty)
│   ├── utils/           # Helpers (logger, errors, etc.)
│   ├── app.js           # Express app
│   └── server.js        # Entry point
├── .env                 # Your config
└── package.json         # Dependencies
```

## Next Steps

1. **Read the Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed explanations

2. **Add Your Business Logic**:
   - Create new models in `src/models/`
   - Add controllers in `src/controllers/`
   - Define routes in `src/routes/`
   - Register routes in `src/app.js`

3. **Implement Email Sending**:
   - Configure SMTP in `.env`
   - Uncomment email code in `auth.controller.js`
   - Create email templates

4. **Add Validation**:
   - Install Joi or Zod
   - Create validation middleware
   - Apply to routes

5. **Add Testing**:
   - Install Jest or Mocha
   - Write unit tests for utils
   - Write integration tests for routes

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=3000

# Or kill the process
lsof -ti:8000 | xargs kill -9
```

### JWT Verification Failed
- Check that tokens match in `.env`
- Ensure tokens are properly passed in Authorization header
- Verify token hasn't expired

### CORS Errors
```bash
# Add your frontend URL to .env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Make changes**: Edit files in `src/`
3. **Auto-reload**: Nodemon restarts server
4. **Test endpoint**: Use Postman/curl
5. **Check logs**: See console output
6. **Commit**: Git commit your changes

## Production Deployment

Before deploying:

1. ✅ Set `NODE_ENV=production` in `.env`
2. ✅ Use strong secrets for JWT tokens
3. ✅ Enable HTTPS (secure cookies)
4. ✅ Set proper CORS origins
5. ✅ Use environment-specific MongoDB URI
6. ✅ Add rate limiting
7. ✅ Enable monitoring/logging service
8. ✅ Set up CI/CD pipeline

## Support

- **Documentation**: See [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues**: Check error logs in console
- **Reference**: Based on FlexiPay backend architecture

---

**You're all set!** 🚀 Start building your business logic on this solid foundation.
