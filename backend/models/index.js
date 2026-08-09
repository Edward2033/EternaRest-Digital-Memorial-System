// Central model registry — imports every model so Mongoose registers each
// collection exactly once. Import from here in any controller or seeder.

const User          = require('./User');
const Admin         = require('./Admin');
const Role          = require('./Role');
const Booking       = require('./Booking');
const Payment       = require('./Payment');
const Memorial      = require('./Memorial');
const Media         = require('./Media');
const QRCode        = require('./QRCode');
const Comment       = require('./Comment');
const FamilyAccount = require('./FamilyAccount');
const Package       = require('./Package');
const Niche         = require('./Niche');
const Invoice       = require('./Invoice');
const Notification  = require('./Notification');
const ActivityLog   = require('./ActivityLog');
const Analytics     = require('./Analytics');
const Setting       = require('./Setting');
const HeroSlide     = require('./HeroSlide');
const Banner        = require('./Banner');
const Service       = require('./Service');
const Testimonial   = require('./Testimonial');
const Gallery       = require('./Gallery');
const Contact       = require('./Contact');
const FAQ           = require('./FAQ');

module.exports = {
  User,
  Admin,
  Role,
  Booking,
  Payment,
  Memorial,
  Media,
  QRCode,
  Comment,
  FamilyAccount,
  Package,
  Niche,
  Invoice,
  Notification,
  ActivityLog,
  Analytics,
  Setting,
  HeroSlide,
  Banner,
  Service,
  Testimonial,
  Gallery,
  Contact,
  FAQ,
};
