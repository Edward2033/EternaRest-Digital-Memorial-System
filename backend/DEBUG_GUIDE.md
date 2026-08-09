# COMPLETE DATA PIPELINE FIX

## ✅ What Was Fixed

### 1. Frontend API Calls
- Updated `src/lib/api.ts` to call Node.js backend instead of Supabase
- Fixed `createBooking()` to map frontend fields to backend schema
- Fixed `getBookings()` to fetch from MongoDB
- Fixed `updateBookingStatus()` to approve/reject bookings
- Fixed `getStats()` to fetch dashboard statistics
- Fixed `login()` to authenticate with Node.js backend

### 2. Backend Logging
- Added detailed request logging with body content
- Console logs show: Method, Path, Request Body

### 3. Schema Mapping
Frontend → Backend:
```
requester_name → bookerName
requester_email → bookerEmail
requester_phone → bookerPhone
deceased_name → deceasedName
message → biography
```

## 🧪 Testing Steps

### Test 1: Create Booking
1. Go to http://localhost:5173/booking
2. Fill form:
   - Your Name: John Smith
   - Email: john@example.com
   - Phone: 555-1234
   - Deceased Name: Jane Doe
3. Select niche location
4. Submit booking
5. Check backend console for:
   ```
   📨 POST /api/bookings
   📦 Body: { bookerName: "John Smith", ... }
   📝 Creating new booking...
   ✅ Booking saved: BK-XXXXX
   ```
6. Check MongoDB for new document

### Test 2: View Bookings in Admin
1. Go to http://localhost:5173/admin
2. Login: admin@eternarest.com / admin123
3. Click "Bookings" tab
4. Should see all bookings from MongoDB
5. Check console for:
   ```
   📨 GET /api/bookings
   📋 Fetching all bookings...
   ```

### Test 3: Approve Booking
1. In admin dashboard, click "Approve" on pending booking
2. Check console for:
   ```
   📨 PUT /api/bookings/approve/BK-XXXXX
   ✅ Approving booking: BK-XXXXX
   🔲 QR Code generated
   📧 Approval email sent
   ```
3. Check MongoDB - status should be "approved"
4. Check uploads/qrcodes/ for QR code image
5. Check email inbox for approval email

### Test 4: Dashboard Stats
1. Go to admin dashboard "Overview" tab
2. Should show:
   - Total Bookings
   - Pending Bookings
   - Approved Bookings
   - Total Memorials
3. Check console for:
   ```
   📨 GET /api/dashboard/stats
   📊 Fetching dashboard stats...
   ```

## 📋 Sample JSON Responses

### POST /api/bookings
```json
{
  "success": true,
  "message": "Booking created successfully",
  "bookingId": "BK-MLH1WWGH-IFPC5",
  "booking": {
    "bookingId": "BK-MLH1WWGH-IFPC5",
    "deceasedName": "Jane Doe",
    "bookerName": "John Smith",
    "bookerEmail": "john@example.com",
    "bookerPhone": "555-1234",
    "packageType": "standard",
    "price": 199,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/bookings
```json
{
  "success": true,
  "count": 2,
  "bookings": [
    {
      "_id": "65a5b1c2d3e4f5g6h7i8j9k0",
      "bookingId": "BK-MLH1WWGH-IFPC5",
      "deceasedName": "Jane Doe",
      "bookerName": "John Smith",
      "bookerEmail": "john@example.com",
      "bookerPhone": "555-1234",
      "packageType": "standard",
      "price": 199,
      "status": "pending",
      "qrCode": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### PUT /api/bookings/approve/:id
```json
{
  "success": true,
  "message": "Booking approved successfully",
  "booking": {
    "bookingId": "BK-MLH1WWGH-IFPC5",
    "status": "approved",
    "qrCode": "/uploads/qrcodes/qr-BK-MLH1WWGH-IFPC5.png",
    "approvedAt": "2024-01-15T11:00:00.000Z"
  },
  "qrCode": "/uploads/qrcodes/qr-BK-MLH1WWGH-IFPC5.png"
}
```

### GET /api/dashboard/stats
```json
{
  "success": true,
  "stats": {
    "totalBookings": 5,
    "pendingBookings": 2,
    "approvedBookings": 3,
    "totalMemorials": 3
  }
}
```

## 🔧 Debugging Checklist

If bookings not saving:
- [ ] Backend server running on port 5000
- [ ] MongoDB connection successful (check console for "✅ MongoDB Connected")
- [ ] CORS enabled in server.js
- [ ] express.json() middleware active
- [ ] Check browser console for fetch errors
- [ ] Check backend console for request logs

If admin not showing data:
- [ ] Admin logged in successfully
- [ ] Check Network tab for API calls
- [ ] Verify API returns success: true
- [ ] Check data mapping in api.ts

If approve not working:
- [ ] QR code directory exists: backend/uploads/qrcodes/
- [ ] Email credentials configured in .env
- [ ] Check booking ID matches exactly

## 🚀 Quick Start

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Admin: http://localhost:5173/admin

## 📝 Console Output Examples

### Successful Booking Creation:
```
📨 POST /api/bookings
📦 Body: {
  "bookerName": "John Smith",
  "bookerEmail": "john@example.com",
  "deceasedName": "Jane Doe",
  "packageType": "standard",
  "price": 199
}
📝 Creating new booking...
✅ Booking saved: BK-MLH1WWGH-IFPC5
```

### Successful Approval:
```
📨 PUT /api/bookings/approve/BK-MLH1WWGH-IFPC5
✅ Approving booking: BK-MLH1WWGH-IFPC5
🔲 QR Code generated: C:\...\backend\uploads\qrcodes\qr-BK-MLH1WWGH-IFPC5.png
📧 Approval email sent to: john@example.com
```

## ✅ All Fixed Issues

1. ✅ Frontend form now submits to Node.js backend
2. ✅ Data saves to MongoDB correctly
3. ✅ Admin dashboard fetches from MongoDB
4. ✅ Bookings display in real-time table
5. ✅ Approve button generates QR code
6. ✅ Email sent automatically on approval
7. ✅ Schema mapping between frontend/backend
8. ✅ CORS and middleware configured
9. ✅ Detailed console logging added
10. ✅ All existing functions preserved
