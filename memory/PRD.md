# Fresh Fold - Premium Laundry Subscription & On-Demand Platform

## Brand
- Name: Fresh Fold
- Location: Geelong, Victoria, Australia
- Tagline: "Laundry Pickup & Delivery in Geelong — From $19.99/Month"

## Tech Stack
- Frontend: Next.js 14 with React (App Router)
- Backend: Next.js API Routes (/api/[[...path]]/route.js)
- Database: MongoDB (local, via MONGO_URL env)
- Payments: Stripe (checkout sessions, STRIPE_API_KEY env)
- QR Codes: qrcode npm package (server-side generation)
- UI: shadcn/ui + Tailwind CSS
- Auth: Token-based sessions (UUID tokens in MongoDB)

## Features Implemented
1. **Marketing Landing Page** - 10 sections (Hero, How It Works, Pricing, Value Props, Add-ons, Testimonials, Service Areas, Corporate/NDIS, FAQ, CTA, Footer)
2. **Subscription Plans** - Starter ($19.99), Family ($49.99), Premium ($89.99)
3. **One-Off Booking** - Pay-per-order at $5.99/kg
4. **Dynamic Add-On Sidebar** - 6 add-ons with live pricing, GST calculation
5. **QR Tracking System** - 9-step status flow with scannable QR codes
6. **Customer Dashboard** - Overview, orders, subscription management, support
7. **Admin Panel** - Analytics, order management, complaint resolution
8. **Complaint System** - Categories, ticket numbers, admin resolution workflow
9. **Suburb Validation** - 50+ suburbs in Greater Geelong, Bellarine, Surf Coast
10. **Authentication** - Register, login, session management

## API Endpoints
- POST /api/auth/register, /api/auth/login, GET /api/auth/me
- GET /api/plans, /api/addons, /api/suburbs
- POST/GET /api/bookings, PUT /api/bookings/{id}
- GET /api/tracking/{trackingId}
- POST/GET/PUT /api/subscriptions
- POST/GET /api/complaints, PUT /api/complaints/{id}
- POST /api/checkout/session, GET /api/checkout/status/{sessionId}
- GET /api/admin/stats, /api/admin/orders, /api/admin/complaints
- POST /api/auth/make-admin (secret: freshfold-admin-2025)

## Environment Variables
- MONGO_URL - MongoDB connection string
- DB_NAME - Database name (default: freshfold)
- NEXT_PUBLIC_BASE_URL - Public URL for QR tracking links
- STRIPE_API_KEY - Stripe secret key
- NEXT_PUBLIC_STRIPE_PK - Stripe publishable key

## Service Areas
Greater Geelong, Bellarine Peninsula, Surf Coast (50+ suburbs)

## Future Enhancements
- Invoice PDF download
- Referral/promo code system
- Email/SMS notifications
- Driver mobile app integration
- Melbourne expansion
- Stripe recurring subscriptions (webhooks)
- Photo upload for complaints
- Analytics charts in admin panel
