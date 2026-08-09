# Memorial Booking Backend

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Edit `.env` file and add your email credentials:
- EMAIL_USER: Your Gmail address
- EMAIL_PASS: Your Gmail app password (not regular password)

### 3. Create Admin User (Optional)
Run this script once to create an admin account:
```bash
node createAdmin.js
```

### 4. Start Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on: http://localhost:5000

## API Endpoints

### Bookings
- POST `/api/bookings` - Create new booking
- GET `/api/bookings` - Get all bookings
- GET `/api/bookings/:id` - Get booking by ID
- PUT `/api/bookings/approve/:id` - Approve booking & generate QR
- PUT `/api/bookings/reject/:id` - Reject booking

### Memorials
- POST `/api/memorials` - Create memorial
- GET `/api/memorials` - Get all memorials
- GET `/api/memorials/:bookingId` - Get memorial by booking ID
- POST `/api/memorials/:bookingId/tribute` - Add tribute

### Admin
- POST `/api/admin/login` - Admin login

### Dashboard
- GET `/api/dashboard/stats` - Get dashboard statistics

## Frontend Integration

Update your frontend forms to use these endpoints:
```javascript
// Example: Create booking
fetch('http://localhost:5000/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
})
```
