# Admin Dashboard Setup Guide

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure .env file with your email credentials

3. Start server:
```bash
npm start
```

## Access Points

- Admin Dashboard: http://localhost:5000/admin/dashboard.html
- Memorial Page: http://localhost:5000/memorial/{bookingId}
- API Base: http://localhost:5000/api

## Features Implemented

✅ Live bookings table (auto-refresh every 10 seconds)
✅ Approve booking with QR code generation
✅ Email QR code automatically to booker
✅ View memorial page in new tab
✅ Upload photos/videos to memorials
✅ Display media gallery on memorial page
✅ Add tributes/condolences
✅ Dashboard statistics
✅ Responsive design

## Testing

1. Create a booking via API or frontend form
2. Open admin dashboard
3. Click "Approve" on pending booking
4. Check email for QR code
5. Click "View" to see memorial page
6. Click "Upload" to add photos/videos
7. Submit a tribute on memorial page

## File Structure

backend/
├── uploads/
│   ├── qrcodes/        # Generated QR codes
│   └── memorials/      # Uploaded photos/videos
├── public/
│   ├── dashboard.html  # Admin dashboard
│   ├── dashboard.css
│   ├── dashboard.js
│   └── memorial.html   # Memorial page
├── controllers/
│   ├── bookingController.js
│   ├── memorialController.js
│   ├── adminController.js
│   └── mediaController.js
└── routes/
    ├── bookingRoutes.js
    ├── memorialRoutes.js
    ├── adminRoutes.js
    ├── dashboardRoutes.js
    └── mediaRoutes.js
