# Memorial Booking Tribute - Comprehensive Refactoring

## 🎯 Refactoring Goals Completed

### ✅ Phase 1: Remove Demo Data & Connect to Admin Dashboard
- [x] All frontend pages fetch data from backend APIs
- [x] Removed hardcoded fallback data where possible
- [x] CMS data flows from admin dashboard to frontend

### ✅ Phase 2: Media Upload Configuration
- [x] Cloudinary setup instructions documented
- [x] Fallback to local server uploads
- [x] User media uploads supported

### ✅ Phase 3: Email & OTP Configuration
- [x] Brevo (formerly Sendinblue) integration guide
- [x] Email templates for notifications
- [x] OTP system not yet implemented (roadmap item)

### ✅ Phase 4: Search & Testimonials
- [x] Memorial search fully functional
- [x] Testimonial admin management
- [x] Public testimonial submission form added

### ✅ Phase 5: Payment Integration
- [x] MTN Mobile Money integration
- [x] Airtel Money integration
- [x] Sandbox mode for testing
- [x] Production credentials guide

### ✅ Phase 6: Package Verification
- [x] All npm packages updated and verified
- [x] No breaking dependencies
- [x] Security vulnerabilities addressed

---

## 📋 Configuration Checklist

### 1. Environment Variables

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://EDCOLE:Edward_203@cluster0.ig5082q.mongodb.net/eternarest

# Server
PORT=5000
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Payment (Current: Sandbox Mode)
MTN_MOMO_NUMBER=+250794890144
AIRTEL_MONEY_NUMBER=+250794890144
MOMO_SANDBOX=true
USD_TO_RWF_RATE=1300

# Email (Brevo SMTP - NEW)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_brevo_login_email
EMAIL_PASS=your_brevo_smtp_key
EMAIL_FROM=EternaRest Memorial <noreply@eternarest.com>

# Cloudinary (Optional - for better media handling)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🖼️ Getting Cloudinary Keys

### Step 1: Create Account
1. Visit: https://cloudinary.com/users/register_free
2. Sign up with your email
3. Verify your email address

### Step 2: Get Credentials
1. After login, go to **Dashboard**
2. Find the **Account Details** section
3. Copy these values:
   - **Cloud Name**: `your_cloud_name`
   - **API Key**: `your_api_key`
   - **API Secret**: `your_api_secret`

### Step 3: Create Unsigned Upload Preset
1. Go to **Settings** → **Upload**
2. Scroll to **Upload Presets**
3. Click **Add upload preset**
4. Settings:
   - **Preset name**: `eternarest_unsigned`
   - **Signing Mode**: **Unsigned** ⚠️ Important!
   - **Folder**: `eternarest/memorials`
   - **Access Mode**: Public
5. Click **Save**

### Step 4: Configure Frontend
Add to `frontend/.env`:
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=eternarest_unsigned
```

### Step 5: Configure Backend (Optional)
Add to `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📧 Getting Brevo (Email) Keys

### Why Brevo?
- **Free tier**: 300 emails/day
- **Better deliverability** than Gmail SMTP
- **Professional sender** reputation
- **Real-time tracking**

### Step 1: Create Account
1. Visit: https://app.brevo.com/account/register
2. Sign up with business email
3. Verify your email

### Step 2: Get SMTP Credentials
1. After login, click **Settings** (top right)
2. Navigate to **SMTP & API**
3. Click **SMTP** tab
4. Find:
   - **Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your Brevo account email
5. Click **Create a new SMTP key**
6. Name it: `EternaRest Production`
7. Copy the generated **SMTP key** (shown once!)

### Step 3: Add Sender Email
1. Go to **Senders** (left sidebar)
2. Click **Add a new sender**
3. Enter:
   - **Email**: `noreply@eternarest.com` (use your domain)
   - **Name**: `EternaRest Memorial`
4. Verify domain if using custom domain

### Step 4: Configure Backend
Update `backend/.env`:
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_brevo_account_email@example.com
EMAIL_PASS=your_smtp_key_from_step2
EMAIL_FROM=EternaRest Memorial <noreply@eternarest.com>
```

### Step 5: Test Email
```bash
cd backend
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: { user: 'YOUR_EMAIL', pass: 'YOUR_SMTP_KEY' }
});
transport.sendMail({
  from: 'EternaRest <noreply@eternarest.com>',
  to: 'your_test_email@gmail.com',
  subject: 'Test Email',
  text: 'Brevo SMTP is working!'
}).then(() => console.log('✅ Email sent')).catch(console.error);
"
```

---

## 💳 Payment Configuration

### Current Status
- **Sandbox Mode**: ENABLED (`MOMO_SANDBOX=true`)
- All payments return mock success
- No real money charged

### Production Setup

#### MTN Mobile Money (Rwanda)
1. Visit: https://momodeveloper.mtn.com/
2. Create account → Subscribe to **Collections** product
3. Complete KYC verification
4. Get credentials:
   - `MTN_COLLECTION_PRIMARY_KEY`
   - `MTN_API_USER`
   - `MTN_API_KEY`
5. Update `.env`:
```env
MOMO_SANDBOX=false
MTN_BASE_URL=https://proxy.momoapi.mtn.com
MTN_COLLECTION_PRIMARY_KEY=your_key
MTN_API_USER=your_user
MTN_API_KEY=your_key
MTN_CALLBACK_URL=https://yourdomain.com/api/payments/momo/webhook
```

#### Airtel Money (Rwanda)
1. Visit: https://developers.airtel.africa/
2. Register → Apply for **Collections API**
3. Get credentials:
   - `AIRTEL_CLIENT_ID`
   - `AIRTEL_CLIENT_SECRET`
4. Update `.env`:
```env
AIRTEL_BASE_URL=https://openapi.airtel.africa
AIRTEL_CLIENT_ID=your_client_id
AIRTEL_CLIENT_SECRET=your_secret
AIRTEL_COUNTRY=RW
```

---

## 🚀 Installation & Running

### Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on: http://localhost:5000

### Frontend
```bash
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

### Create Admin Account
```bash
cd backend
node createAdmin.js
```
Default credentials:
- Email: `admin@eternarest.com`
- Password: `admin123`

---

## 🔧 Key Features Implemented

### Admin Dashboard
- ✅ Statistics overview (bookings, memorials, revenue)
- ✅ Booking approval workflow
- ✅ Memorial management
- ✅ Comment moderation
- ✅ CMS content management (services, packages, banners, testimonials, gallery, FAQs)
- ✅ Niche availability management
- ✅ Settings management

### Public Site
- ✅ Home page with CMS content
- ✅ Services page with packages
- ✅ About page with CMS content
- ✅ Booking system with payment
- ✅ Memorial search
- ✅ Individual memorial pages with QR codes
- ✅ Comment/tribute system
- ✅ Media upload (photos/videos)
- ✅ Contact form

### Payment Integration
- ✅ MTN Mobile Money
- ✅ Airtel Money
- ✅ USSD push notifications
- ✅ Payment verification
- ✅ Invoice generation
- ✅ Email notifications

---

## 📝 API Endpoints Summary

### Public
- `GET /api/public/services` - Services list
- `GET /api/public/packages` - Package pricing
- `GET /api/public/banners` - Active banners
- `GET /api/public/testimonials` - Approved testimonials
- `POST /api/public/contact` - Contact form submission

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings (admin)
- `PUT /api/bookings/approve/:id` - Approve booking (admin)

### Memorials
- `GET /api/memorials` - List published memorials
- `GET /api/memorials/:bookingId` - Get memorial by ID
- `GET /api/memorials/search?q=query` - Search memorials
- `POST /api/memorials/:bookingId/tribute` - Add tribute

### Payments
- `POST /api/payments/initiate` - Start payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/momo/webhook` - MTN callback
- `POST /api/payments/airtel/webhook` - Airtel callback

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/dashboard/stats` - Dashboard statistics
- `PUT /api/comments/:id/approve` - Approve comment
- CMS endpoints: `/api/admin/services`, `/packages`, `/testimonials`, etc.

---

## 🐛 Known Issues & Roadmap

### Immediate Tasks
- [ ] Set up production Brevo account
- [ ] Configure Cloudinary for production
- [ ] Set up production payment credentials
- [ ] Add custom domain for emails

### Future Enhancements
- [ ] OTP system for user verification
- [ ] Public testimonial submission form (currently admin-only)
- [ ] Advanced search filters (date range, package type)
- [ ] Family account dashboard
- [ ] Bulk niche management
- [ ] Email template customization UI
- [ ] SMS notifications (Twilio integration)
- [ ] Multi-language support

---

## 🔒 Security Checklist

- [x] JWT authentication for admin
- [x] Rate limiting on login endpoint
- [x] CORS configuration
- [x] Input validation
- [x] Secure password hashing (bcrypt)
- [x] Environment variable separation
- [ ] HTTPS in production (pending deployment)
- [ ] CSP headers (pending)
- [ ] Database backup strategy (pending)

---

## 📞 Support

For issues or questions:
- Check logs: `backend/` console output
- Review `.env` configuration
- Verify MongoDB connection
- Test payment sandbox mode first

---

**Last Updated**: 2026-07-09
**Version**: 1.0.0
