# EternaRest Memorial Booking & Tribute Platform

A comprehensive digital memorial and burial niche booking system combining physical memorial spaces with QR-linked digital tributes.

## 🌟 Features

### Public Website
- 🏠 **Home Page**: Hero section, services showcase, gallery, testimonials
- 📖 **About Page**: Company story, values, facility information
- 🛍️ **Services & Packages**: Detailed service descriptions with pricing
- 📅 **Booking System**: Online burial niche reservation with payment
- 🔍 **Memorial Search**: Search published memorials by name or ID
- 💐 **Individual Memorial Pages**: Photo galleries, videos, biography, QR codes
- 💬 **Tribute System**: Leave condolences and comments
- 📸 **Media Uploads**: Photos and videos from family members
- 📞 **Contact Form**: Direct communication with staff
- ⭐ **Public Testimonials**: Submit reviews (pending admin approval)

### Admin Dashboard
- 📊 **Statistics Overview**: Bookings, revenue, memorials, comments
- ✅ **Booking Approval Workflow**: Review and approve reservations
- 🖼️ **Memorial Management**: Publish, edit, moderate memorials
- 💬 **Comment Moderation**: Approve/reject tributes
- 🎨 **Full CMS**:
  - Services, Packages, Banners
  - Hero Slides, Testimonials
  - Gallery Albums, FAQs
  - Site Settings
  - Niche Availability Management

### Payment Integration
- 💳 **MTN Mobile Money** (Rwanda)
- 📱 **Airtel Money** (Rwanda)
- 🔔 **USSD Push Notifications**
- ✓ **Automated Verification**
- 📧 **Payment Receipts**
- 🧾 **Invoice Generation**

### Technical Features
- 🔐 **JWT Authentication** for admin
- 🚀 **RESTful API** architecture
- 📦 **MongoDB** database
- ☁️ **Cloudinary** media storage
- 📧 **Brevo** email service
- 📱 **QR Code** generation
- 🎯 **Rate Limiting** on sensitive endpoints
- 📝 **Activity Logging** for audit trails

---

## 📦 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Cloudinary** for direct browser uploads

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Nodemailer** for emails (Brevo SMTP)
- **Multer** for file uploads
- **QRCode** library for QR generation
- **bcrypt** for password hashing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB database
- Git

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd memorial-booking-tribute

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Environment Setup

**Create `frontend/.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

**Create `backend/.env`:**
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key

# Email (Brevo SMTP)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_smtp_key
EMAIL_FROM=EternaRest <noreply@eternarest.com>

# Payment (Sandbox for testing)
MOMO_SANDBOX=true
MTN_MOMO_NUMBER=+250794890144
AIRTEL_MONEY_NUMBER=+250794890144
USD_TO_RWF_RATE=1300
```

### Run Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Create Admin Account
```bash
cd backend
node createAdmin.js
```

**Default Login:**
- Email: admin@eternarest.com
- Password: admin123

---

## 📚 Documentation

### Complete Guides
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup for Cloudinary, Brevo, payments
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - Technical architecture & changes
- **[backend/API_EXAMPLES.md](./backend/API_EXAMPLES.md)** - API endpoint documentation
- **[backend/DEBUG_GUIDE.md](./backend/DEBUG_GUIDE.md)** - Troubleshooting guide

### Key Sections
1. **Cloudinary Setup**: Media storage configuration
2. **Brevo Email**: Professional SMTP service setup
3. **Payment Gateways**: MTN & Airtel Money integration
4. **Environment Variables**: Complete .env reference
5. **API Documentation**: All available endpoints

---

## 🔑 Getting API Keys

### Cloudinary (Free - 25GB storage)
1. Sign up: https://cloudinary.com/users/register_free
2. Dashboard → Copy **Cloud Name**, **API Key**, **API Secret**
3. Settings → Upload → Create **unsigned preset**
4. See [SETUP_GUIDE.md](./SETUP_GUIDE.md#cloudinary-setup) for details

### Brevo Email (Free - 300 emails/day)
1. Sign up: https://app.brevo.com/account/register
2. Settings → SMTP & API → Get **SMTP credentials**
3. Senders → Add **sender email**
4. See [SETUP_GUIDE.md](./SETUP_GUIDE.md#brevo-setup) for details

### Payment Gateways (Production)
- **MTN MoMo**: https://momodeveloper.mtn.com/
- **Airtel Money**: https://developers.airtel.africa/
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md#payment-gateway-setup) for details

---

## 📡 API Endpoints

### Public
```
GET  /api/public/services       - Services list
GET  /api/public/packages       - Package pricing
GET  /api/public/banners        - Active banners
GET  /api/public/testimonials   - Approved testimonials
GET  /api/public/gallery        - Gallery albums
GET  /api/public/faqs           - FAQs
GET  /api/public/settings       - Public site settings
POST /api/public/contact        - Contact form submission
POST /api/public/testimonials   - Submit testimonial (pending approval)
```

### Bookings
```
POST /api/bookings              - Create booking
GET  /api/bookings              - List bookings (admin)
GET  /api/bookings/:id          - Get booking details
PUT  /api/bookings/approve/:id  - Approve booking (admin)
PUT  /api/bookings/reject/:id   - Reject booking (admin)
```

### Memorials
```
GET  /api/memorials                - List published memorials
GET  /api/memorials/:bookingId     - Get memorial by ID
GET  /api/memorials/search?q=name  - Search memorials
POST /api/memorials/:id/tribute    - Add tribute/comment
POST /api/memorials/:id/media      - Upload media (photo/video)
```

### Payments
```
POST /api/payments/initiate          - Start payment (MTN/Airtel)
POST /api/payments/verify            - Verify payment status
POST /api/payments/momo/webhook      - MTN callback
POST /api/payments/airtel/webhook    - Airtel callback
```

### Admin
```
POST /api/admin/login               - Admin authentication
GET  /api/dashboard/stats           - Dashboard statistics
PUT  /api/comments/:id/approve      - Approve comment
PUT  /api/comments/:id/reject       - Reject comment

# CMS Endpoints (all require admin JWT)
GET|POST|PUT|DELETE /api/admin/services
GET|POST|PUT|DELETE /api/admin/packages
GET|POST|PUT|DELETE /api/admin/banners
GET|POST|PUT|DELETE /api/admin/testimonials
GET|POST|PUT|DELETE /api/admin/gallery
GET|POST|PUT|DELETE /api/admin/faqs
GET|POST|PUT|DELETE /api/admin/niches
```

---

## 🏗️ Project Structure

```
memorial-booking-tribute/
├── backend/
│   ├── config/           # Database connection
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, validation
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── scripts/         # Seed data, migrations
│   ├── uploads/         # Local media storage
│   ├── utils/           # Helpers (email, payment)
│   ├── .env             # Backend environment variables
│   ├── server.js        # Express app entry point
│   └── package.json
├── src/
│   ├── components/      # Reusable UI components
│   │   └── ui/         # shadcn components
│   ├── contexts/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities, API client
│   ├── pages/          # Page components
│   │   ├── admin/     # Admin dashboard pages
│   │   └── *.tsx      # Public pages
│   └── main.tsx        # React app entry point
├── .env                 # Frontend environment variables
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── SETUP_GUIDE.md       # Detailed setup instructions
└── README.md           # This file
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Admin login works
- [ ] Create CMS content (service, package)
- [ ] Create booking from website
- [ ] Initiate payment (sandbox mode)
- [ ] Verify memorial page created
- [ ] Check QR code generated
- [ ] Confirm email received
- [ ] Test memorial search
- [ ] Add comment/tribute
- [ ] Upload memorial photo
- [ ] Submit testimonial
- [ ] Test contact form

### Test Payment (Sandbox)
```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK-TEST123",
    "provider": "mtn",
    "phoneNumber": "+250788123456"
  }'
```

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Add environment variables (VITE_*)
4. Deploy

### Backend (Railway/Render)
1. Start command: `npm start`
2. Add all backend environment variables
3. Set `NODE_ENV=production`
4. Set `MOMO_SANDBOX=false` for real payments
5. Configure MongoDB IP whitelist
6. Deploy

### Post-Deployment
- [ ] Test live booking flow
- [ ] Verify emails arrive
- [ ] Test payment (small amount first)
- [ ] Monitor server logs
- [ ] Configure SSL/HTTPS
- [ ] Set up domain DNS
- [ ] Create database backups

---

## 🔒 Security

- ✅ JWT authentication for admin
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on login endpoint (10 attempts/15min)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Environment variable separation
- ✅ Secure payment webhook verification
- ⚠️ HTTPS required in production
- ⚠️ Change default admin password
- ⚠️ Use strong JWT_SECRET

---

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to MongoDB"**
- Verify MONGODB_URI in .env
- Check IP whitelist in MongoDB Atlas
- Ensure database user has read/write permissions

**"Cloudinary upload failed"**
- Check preset is "unsigned"
- Verify cloud name is correct
- Ensure CORS is enabled (default for unsigned)

**"Emails not sending"**
- Verify Brevo SMTP key in .env
- Check sender email is verified in Brevo
- Test with backend/test-email.js

**"Payment always fails"**
- In sandbox mode: should auto-succeed
- Check MOMO_SANDBOX=true
- For production: verify API credentials

**"Admin login fails"**
- Run: cd backend && node createAdmin.js
- Default: admin@eternarest.com / admin123
- Check JWT_SECRET is set in .env

---

## 📊 Database Models

- **Admin** - Admin users with JWT auth
- **Booking** - Niche reservations
- **Memorial** - Published memorial pages
- **Media** - Photos/videos
- **Comment** - Tributes and condolences
- **Payment** - Transaction records
- **Invoice** - Billing documents
- **QRCode** - Generated QR codes
- **Niche** - Physical niche locations
- **Package** - Service packages
- **Service** - Service offerings
- **Testimonial** - Customer reviews
- **Banner** - Promotional banners
- **HeroSlide** - Homepage carousel
- **Gallery** - Photo albums
- **FAQ** - Frequently asked questions
- **Setting** - Site configuration
- **Contact** - Contact form submissions
- **FamilyAccount** - Family member logins
- **Notification** - In-app notifications
- **ActivityLog** - Audit trail

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open pull request

---

## 📝 License

This project is private and proprietary.

---

## 📞 Support

For setup help, see:
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[backend/DEBUG_GUIDE.md](./backend/DEBUG_GUIDE.md)** - Troubleshooting tips

---

**Version**: 1.0.0  
**Last Updated**: 2026-07-09  
**Built with ❤️ for EternaRest Memorial Services**
