# API Testing Examples

## 1. Get All Bookings
GET http://localhost:5000/api/bookings

Response:
{
  "success": true,
  "count": 2,
  "bookings": [
    {
      "_id": "...",
      "bookingId": "BK-ABC123",
      "deceasedName": "John Doe",
      "packageType": "premium",
      "price": 299,
      "status": "approved",
      "qrCode": "/uploads/qrcodes/qr-BK-ABC123.png",
      "bookerEmail": "family@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "approvedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}

## 2. Approve Booking
PUT http://localhost:5000/api/bookings/approve/BK-ABC123

Response:
{
  "success": true,
  "message": "Booking approved successfully",
  "booking": { ... },
  "qrCode": "/uploads/qrcodes/qr-BK-ABC123.png"
}

## 3. Upload Media
POST http://localhost:5000/api/media/upload/BK-ABC123
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "message": "Media uploaded successfully",
  "media": [
    {
      "_id": "...",
      "bookingId": "BK-ABC123",
      "type": "photo",
      "url": "/uploads/memorials/1234567890-abc.jpg",
      "filename": "1234567890-abc.jpg"
    }
  ]
}

## 4. Get Memorial
GET http://localhost:5000/api/memorials/BK-ABC123

Response:
{
  "success": true,
  "memorial": {
    "_id": "...",
    "bookingId": "BK-ABC123",
    "deceasedName": "John Doe",
    "biography": "...",
    "media": [...],
    "tributes": [
      {
        "name": "Jane Smith",
        "message": "Rest in peace",
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}

## 5. Dashboard Stats
GET http://localhost:5000/api/dashboard/stats

Response:
{
  "success": true,
  "stats": {
    "totalBookings": 10,
    "pendingBookings": 3,
    "approvedBookings": 7,
    "totalMemorials": 7
  }
}
