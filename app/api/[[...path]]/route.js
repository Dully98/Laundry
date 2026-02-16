import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import QRCode from 'qrcode';

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const client = await MongoClient.connect(process.env.MONGO_URL);
  cachedDb = client.db(process.env.DB_NAME || 'freshfold');
  cachedClient = client;
  return cachedDb;
}

function hashPw(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function cors() {
  return {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: cors() });
}

async function getUser(request) {
  const auth = request.headers.get('Authorization');
  if (!auth) return null;
  const token = auth.replace('Bearer ', '');
  const db = await getDb();
  const session = await db.collection('sessions').findOne({ token, active: true });
  if (!session) return null;
  return db.collection('users').findOne({ id: session.userId });
}

// ===== DATA =====
const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 19.99, badge: null,
    description: 'Affordable, hassle-free laundry service for individuals who need reliable twice-monthly care.',
    features: ['Up to 15 lbs (~7kg) per pickup','2 pickups/month','Standard wash & dry','Folding included','Real-time QR tracking','Secure QR access'],
    maxWeightKg: 7, pickupsPerMonth: 2,
  },
  {
    id: 'family', name: 'Family', price: 49.99, badge: 'Most Popular',
    description: 'Our most popular plan. Weekly convenience with ironing included and premium garment care.',
    features: ['Up to 40 lbs (~18kg) per pickup','Weekly pickups (4/month)','Premium detergents','Ironing & folding','Real-time QR tracking','Secure QR access','Priority support','Custom wash preferences'],
    maxWeightKg: 18, pickupsPerMonth: 4,
  },
  {
    id: 'premium', name: 'Premium', price: 89.99, badge: 'Ultimate',
    description: 'Ultimate garment care with unlimited volume and priority handling.',
    features: ['Unlimited weight','Twice-weekly pickups (8/month)','Luxury detergents','Full ironing service','Delicate care','Real-time QR tracking','Secure QR access','24/7 priority support','Same-day service'],
    maxWeightKg: -1, pickupsPerMonth: 8,
  },
];

const ADDONS = [
  { id: 'ironing', name: 'Extra Ironing Service', unit: 'per bag', price: 14.99 },
  { id: 'folding', name: 'Folding-Only Service', unit: 'per bag', price: 7.99 },
  { id: 'softener', name: 'Fabric Softener', unit: 'per wash', price: 2.99 },
  { id: 'hypoallergenic', name: 'Hypoallergenic Detergent', unit: 'per wash', price: 4.99 },
  { id: 'stain', name: 'Heavy Stain Treatment', unit: 'per item', price: 5.99 },
  { id: 'express', name: 'Express Same-Day Service', unit: 'per order', price: 10.99 },
];

const SERVICE_SUBURBS = [
  'Geelong','Geelong West','Newtown','Highton','Belmont','Grovedale','Waurn Ponds',
  'Corio','Norlane','North Geelong','South Geelong','Drumcondra','Herne Hill',
  'Manifold Heights','Breakwater','East Geelong','Thomson','Whittington',
  'St Albans Park','Newcomb','Moolap','Leopold','Wallington','Ocean Grove',
  'Barwon Heads','Torquay','Jan Juc','Bells Beach','Anglesea','Lorne',
  'Point Lonsdale','Queenscliff','Portarlington','Drysdale','Clifton Springs',
  'Indented Head','St Leonards','Lara','Little River','Anakie','Lovely Banks',
  'Batesford','Fyansford','Stonehaven','Armstrong Creek','Mount Duneed',
  'Charlemont','Marshall','Connewarre','Freshwater Creek',
];

const TRACKING_STATUSES = [
  'Order Placed','Picked Up','Facility Intake','Washing','Drying','Ironing','Quality Check','Out for Delivery','Delivered'
];

const ONE_OFF_RATE_PER_KG = 5.99;
const GST_RATE = 0.10;

// ===== HANDLERS =====

async function handleRegister(request) {
  const body = await request.json();
  const { name, email, password, phone, suburb } = body;
  if (!name || !email || !password) return json({ error: 'Name, email and password required' }, 400);
  const db = await getDb();
  const exists = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (exists) return json({ error: 'Email already registered' }, 409);
  const user = {
    id: uuidv4(), name, email: email.toLowerCase(), password: hashPw(password),
    phone: phone || '', suburb: suburb || '', role: 'customer',
    subscription: null, createdAt: new Date().toISOString(),
  };
  await db.collection('users').insertOne(user);
  const token = uuidv4();
  await db.collection('sessions').insertOne({ token, userId: user.id, active: true, createdAt: new Date().toISOString() });
  const { password: _, ...safe } = user;
  return json({ user: safe, token });
}

async function handleLogin(request) {
  const { email, password } = await request.json();
  if (!email || !password) return json({ error: 'Email and password required' }, 400);
  const db = await getDb();
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user || user.password !== hashPw(password)) return json({ error: 'Invalid credentials' }, 401);
  const token = uuidv4();
  await db.collection('sessions').insertOne({ token, userId: user.id, active: true, createdAt: new Date().toISOString() });
  const { password: _, ...safe } = user;
  return json({ user: safe, token });
}

async function handleMe(request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const { password: _, ...safe } = user;
  return json({ user: safe });
}

async function handleGetPlans() {
  return json({ plans: PLANS });
}

async function handleGetAddons() {
  return json({ addons: ADDONS });
}

async function handleGetSuburbs() {
  return json({ suburbs: SERVICE_SUBURBS });
}

async function handleCreateBooking(request) {
  const user = await getUser(request);
  const body = await request.json();
  const { type, planId, suburb, pickupDate, pickupTimeSlot, deliveryPreference, items, instructions, addons, weightKg, guestEmail, guestName, guestPhone } = body;

  if (!suburb || !SERVICE_SUBURBS.map(s => s.toLowerCase()).includes(suburb.toLowerCase())) {
    return json({ error: 'Service not available in this suburb. We serve Greater Geelong, Bellarine Peninsula, and Surf Coast areas.' }, 400);
  }
  if (!pickupDate || !pickupTimeSlot) return json({ error: 'Pickup date and time slot required' }, 400);

  let baseCost = 0;
  let plan = null;
  if (type === 'subscription' && planId) {
    plan = PLANS.find(p => p.id === planId);
    if (!plan) return json({ error: 'Invalid plan' }, 400);
    baseCost = plan.price;
  } else {
    const weight = weightKg || 5;
    baseCost = parseFloat((weight * ONE_OFF_RATE_PER_KG).toFixed(2));
  }

  let addonsTotal = 0;
  const selectedAddons = [];
  if (addons && Array.isArray(addons)) {
    for (const a of addons) {
      const addon = ADDONS.find(ad => ad.id === a.id);
      if (addon) {
        const qty = a.quantity || 1;
        addonsTotal += addon.price * qty;
        selectedAddons.push({ ...addon, quantity: qty, subtotal: parseFloat((addon.price * qty).toFixed(2)) });
      }
    }
  }

  const subtotal = parseFloat((baseCost + addonsTotal).toFixed(2));
  const gst = parseFloat((subtotal * GST_RATE).toFixed(2));
  const total = parseFloat((subtotal + gst).toFixed(2));

  const trackingId = 'FF-' + uuidv4().substring(0, 8).toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const trackingUrl = `${baseUrl}?track=${trackingId}`;
  let qrCode = '';
  try {
    qrCode = await QRCode.toDataURL(trackingUrl, { width: 300, margin: 2 });
  } catch(e) { console.error('QR generation failed', e); }

  const order = {
    id: uuidv4(),
    trackingId,
    userId: user?.id || null,
    guestEmail: guestEmail || null,
    guestName: guestName || null,
    guestPhone: guestPhone || null,
    type: type || 'one-off',
    planId: planId || null,
    planName: plan?.name || 'One-Off Service',
    suburb,
    pickupDate,
    pickupTimeSlot,
    deliveryPreference: deliveryPreference || 'standard',
    items: items || 0,
    weightKg: weightKg || 5,
    instructions: instructions || '',
    addons: selectedAddons,
    baseCost,
    addonsTotal: parseFloat(addonsTotal.toFixed(2)),
    subtotal,
    gst,
    total,
    status: 'Order Placed',
    statusHistory: [{ status: 'Order Placed', timestamp: new Date().toISOString(), note: 'Order created' }],
    paymentStatus: 'pending',
    qrCode,
    trackingUrl,
    itemsConfirmed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = await getDb();
  await db.collection('orders').insertOne(order);
  return json({ order, message: 'Booking created successfully' }, 201);
}

async function handleGetBookings(request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const db = await getDb();
  const orders = await db.collection('orders').find({ userId: user.id }).sort({ createdAt: -1 }).toArray();
  return json({ orders });
}

async function handleGetBooking(request, bookingId) {
  const db = await getDb();
  const order = await db.collection('orders').findOne({ id: bookingId });
  if (!order) return json({ error: 'Order not found' }, 404);
  return json({ order });
}

async function handleUpdateBookingStatus(request, bookingId) {
  const user = await getUser(request);
  if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
  const { status, note, itemsConfirmed, confirmedItems } = await request.json();
  const db = await getDb();
  const order = await db.collection('orders').findOne({ id: bookingId });
  if (!order) return json({ error: 'Order not found' }, 404);

  const update = { updatedAt: new Date().toISOString() };
  if (status && TRACKING_STATUSES.includes(status)) {
    update.status = status;
    update.statusHistory = [...(order.statusHistory || []), { status, timestamp: new Date().toISOString(), note: note || '' }];
  }
  if (typeof itemsConfirmed === 'boolean') {
    update.itemsConfirmed = itemsConfirmed;
    if (confirmedItems !== undefined) update.confirmedItems = confirmedItems;
  }

  await db.collection('orders').updateOne({ id: bookingId }, { $set: update });
  const updated = await db.collection('orders').findOne({ id: bookingId });
  return json({ order: updated });
}

async function handleGetTracking(trackingId) {
  const db = await getDb();
  const order = await db.collection('orders').findOne({ trackingId });
  if (!order) return json({ error: 'Tracking ID not found' }, 404);
  return json({
    trackingId: order.trackingId,
    status: order.status,
    statusHistory: order.statusHistory,
    planName: order.planName,
    suburb: order.suburb,
    pickupDate: order.pickupDate,
    pickupTimeSlot: order.pickupTimeSlot,
    items: order.items,
    itemsConfirmed: order.itemsConfirmed,
    confirmedItems: order.confirmedItems,
    qrCode: order.qrCode,
    createdAt: order.createdAt,
  });
}

async function handleCreateCheckout(request) {
  const body = await request.json();
  const { orderId, originUrl } = body;
  if (!orderId || !originUrl) return json({ error: 'orderId and originUrl required' }, 400);

  const db = await getDb();
  const order = await db.collection('orders').findOne({ id: orderId });
  if (!order) return json({ error: 'Order not found' }, 404);

  const amount = order.total;
  const successUrl = `${originUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
  const cancelUrl = `${originUrl}?cancelled=true&order_id=${orderId}`;

  const txn = {
    id: uuidv4(),
    orderId,
    userId: order.userId,
    amount: parseFloat(amount.toFixed(2)),
    currency: 'aud',
    paymentStatus: 'initiated',
    sessionId: null,
    metadata: { orderId, type: order.type, planId: order.planId },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_API_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: { name: `Fresh Fold - ${order.planName}`, description: `Order ${order.trackingId}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orderId, trackingId: order.trackingId },
    });
    txn.sessionId = session.id;
    txn.checkoutUrl = session.url;
    await db.collection('payment_transactions').insertOne(txn);
    return json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err.message);
    txn.paymentStatus = 'stripe_error';
    txn.error = err.message;
    await db.collection('payment_transactions').insertOne(txn);
    await db.collection('orders').updateOne({ id: orderId }, { $set: { paymentStatus: 'pending_manual' } });
    return json({ error: 'Payment gateway unavailable. Your order has been created and payment can be completed later.', orderId, trackingId: order.trackingId }, 200);
  }
}

async function handleCheckoutStatus(sessionId) {
  const db = await getDb();
  const txn = await db.collection('payment_transactions').findOne({ sessionId });
  if (!txn) return json({ error: 'Transaction not found' }, 404);

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_API_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const newStatus = session.payment_status === 'paid' ? 'paid' : session.payment_status;

    if (txn.paymentStatus !== 'paid') {
      await db.collection('payment_transactions').updateOne(
        { sessionId },
        { $set: { paymentStatus: newStatus, status: session.status, updatedAt: new Date().toISOString() } }
      );
      if (newStatus === 'paid' && txn.orderId) {
        await db.collection('orders').updateOne(
          { id: txn.orderId },
          { $set: { paymentStatus: 'paid', updatedAt: new Date().toISOString() } }
        );
      }
    }
    return json({ payment_status: newStatus, status: session.status, amount_total: session.amount_total, currency: session.currency });
  } catch (err) {
    return json({ payment_status: txn.paymentStatus, error: err.message });
  }
}

async function handleCreateComplaint(request) {
  const user = await getUser(request);
  const body = await request.json();
  const { orderId, category, description, photoUrl } = body;
  if (!category || !description) return json({ error: 'Category and description required' }, 400);

  const complaint = {
    id: uuidv4(),
    ticketNumber: 'TKT-' + uuidv4().substring(0, 8).toUpperCase(),
    orderId: orderId || null,
    userId: user?.id || null,
    userName: user?.name || body.guestName || 'Guest',
    userEmail: user?.email || body.guestEmail || '',
    category,
    description,
    photoUrl: photoUrl || null,
    status: 'open',
    resolution: null,
    refundAmount: null,
    adminNotes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const db = await getDb();
  await db.collection('complaints').insertOne(complaint);
  return json({ complaint, message: 'Complaint submitted. Ticket: ' + complaint.ticketNumber }, 201);
}

async function handleGetComplaints(request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const db = await getDb();
  const filter = user.role === 'admin' ? {} : { userId: user.id };
  const complaints = await db.collection('complaints').find(filter).sort({ createdAt: -1 }).toArray();
  return json({ complaints });
}

async function handleUpdateComplaint(request, complaintId) {
  const user = await getUser(request);
  if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
  const { status, resolution, refundAmount, adminNote } = await request.json();
  const db = await getDb();
  const complaint = await db.collection('complaints').findOne({ id: complaintId });
  if (!complaint) return json({ error: 'Complaint not found' }, 404);

  const update = { updatedAt: new Date().toISOString() };
  if (status) update.status = status;
  if (resolution) update.resolution = resolution;
  if (refundAmount !== undefined) update.refundAmount = refundAmount;
  if (adminNote) update.adminNotes = [...(complaint.adminNotes || []), { note: adminNote, timestamp: new Date().toISOString(), admin: user.name }];

  await db.collection('complaints').updateOne({ id: complaintId }, { $set: update });
  const updated = await db.collection('complaints').findOne({ id: complaintId });
  return json({ complaint: updated });
}

async function handleAdminStats() {
  const db = await getDb();
  const totalOrders = await db.collection('orders').countDocuments();
  const activeSubscriptions = await db.collection('orders').countDocuments({ type: 'subscription', paymentStatus: 'paid' });
  const totalRevenue = await db.collection('orders').aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]).toArray();
  const oneOffOrders = await db.collection('orders').countDocuments({ type: 'one-off' });
  const openComplaints = await db.collection('complaints').countDocuments({ status: 'open' });
  const recentOrders = await db.collection('orders').find().sort({ createdAt: -1 }).limit(10).toArray();
  const totalUsers = await db.collection('users').countDocuments();

  const monthlyRevenue = await db.collection('orders').aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: { $substr: ['$createdAt', 0, 7] }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 12 }
  ]).toArray();

  return json({
    totalOrders, activeSubscriptions, oneOffOrders, openComplaints, totalUsers,
    totalRevenue: totalRevenue[0]?.total || 0,
    recentOrders, monthlyRevenue,
  });
}

async function handleAdminOrders(request) {
  const user = await getUser(request);
  if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
  const db = await getDb();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const filter = status ? { status } : {};
  const orders = await db.collection('orders').find(filter).sort({ createdAt: -1 }).toArray();
  return json({ orders });
}

async function handleSubscribe(request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const { planId } = await request.json();
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) return json({ error: 'Invalid plan' }, 400);
  const db = await getDb();
  const subscription = {
    id: uuidv4(), userId: user.id, planId: plan.id, planName: plan.name,
    price: plan.price, status: 'active', pickupsUsed: 0,
    pickupsPerMonth: plan.pickupsPerMonth, maxWeightKg: plan.maxWeightKg,
    pausedAt: null, cancelledAt: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await db.collection('subscriptions').insertOne(subscription);
  await db.collection('users').updateOne({ id: user.id }, { $set: { subscription: { planId: plan.id, planName: plan.name, status: 'active' } } });
  return json({ subscription, message: 'Subscribed to ' + plan.name });
}

async function handleGetSubscription(request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const db = await getDb();
  const sub = await db.collection('subscriptions').findOne({ userId: user.id, status: { $in: ['active', 'paused'] } });
  return json({ subscription: sub });
}

async function handleUpdateSubscription(request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const { action, planId } = await request.json();
  const db = await getDb();
  const sub = await db.collection('subscriptions').findOne({ userId: user.id, status: { $in: ['active', 'paused'] } });
  if (!sub) return json({ error: 'No active subscription found' }, 404);

  const update = { updatedAt: new Date().toISOString() };
  if (action === 'pause') { update.status = 'paused'; update.pausedAt = new Date().toISOString(); }
  else if (action === 'resume') { update.status = 'active'; update.pausedAt = null; }
  else if (action === 'cancel') { update.status = 'cancelled'; update.cancelledAt = new Date().toISOString(); }
  else if (action === 'upgrade' && planId) {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return json({ error: 'Invalid plan' }, 400);
    update.planId = plan.id; update.planName = plan.name; update.price = plan.price;
    update.pickupsPerMonth = plan.pickupsPerMonth; update.maxWeightKg = plan.maxWeightKg;
  }

  await db.collection('subscriptions').updateOne({ id: sub.id }, { $set: update });
  if (action === 'cancel') {
    await db.collection('users').updateOne({ id: user.id }, { $set: { subscription: null } });
  } else {
    const updated = await db.collection('subscriptions').findOne({ id: sub.id });
    await db.collection('users').updateOne({ id: user.id }, { $set: { subscription: { planId: updated.planId, planName: updated.planName, status: updated.status } } });
  }
  const updatedSub = await db.collection('subscriptions').findOne({ id: sub.id });
  return json({ subscription: updatedSub });
}

async function handleMakeAdmin(request) {
  const body = await request.json();
  const { email, secret } = body;
  if (secret !== 'freshfold-admin-2025') return json({ error: 'Invalid secret' }, 403);
  const db = await getDb();
  const result = await db.collection('users').updateOne({ email: email.toLowerCase() }, { $set: { role: 'admin' } });
  if (result.matchedCount === 0) return json({ error: 'User not found' }, 404);
  return json({ message: 'User promoted to admin' });
}

// ===== ROUTER =====
async function handler(request, context) {
  if (request.method === 'OPTIONS') return json({});

  const resolvedParams = await context.params;
  const pathArr = resolvedParams?.path || [];
  const p = pathArr.join('/');
  const method = request.method;

  try {
    // Health
    if (p === 'health' && method === 'GET') return json({ status: 'ok', service: 'Fresh Fold API' });

    // Auth
    if (p === 'auth/register' && method === 'POST') return handleRegister(request);
    if (p === 'auth/login' && method === 'POST') return handleLogin(request);
    if (p === 'auth/me' && method === 'GET') return handleMe(request);
    if (p === 'auth/make-admin' && method === 'POST') return handleMakeAdmin(request);

    // Plans & Data
    if (p === 'plans' && method === 'GET') return handleGetPlans();
    if (p === 'addons' && method === 'GET') return handleGetAddons();
    if (p === 'suburbs' && method === 'GET') return handleGetSuburbs();

    // Bookings
    if (p === 'bookings' && method === 'POST') return handleCreateBooking(request);
    if (p === 'bookings' && method === 'GET') return handleGetBookings(request);
    if (pathArr[0] === 'bookings' && pathArr[1] === 'status' && pathArr.length === 3 && method === 'PUT') return handleUpdateBookingStatus(request, pathArr[2]);
    if (pathArr[0] === 'bookings' && pathArr.length === 2 && method === 'GET') return handleGetBooking(request, pathArr[1]);
    if (pathArr[0] === 'bookings' && pathArr.length === 2 && method === 'PUT') return handleUpdateBookingStatus(request, pathArr[1]);

    // Tracking
    if (pathArr[0] === 'tracking' && pathArr.length === 2 && method === 'GET') return handleGetTracking(pathArr[1]);

    // Checkout
    if (p === 'checkout/session' && method === 'POST') return handleCreateCheckout(request);
    if (pathArr[0] === 'checkout' && pathArr[1] === 'status' && pathArr.length === 3 && method === 'GET') return handleCheckoutStatus(pathArr[2]);

    // Complaints
    if (p === 'complaints' && method === 'POST') return handleCreateComplaint(request);
    if (p === 'complaints' && method === 'GET') return handleGetComplaints(request);
    if (pathArr[0] === 'complaints' && pathArr.length === 2 && method === 'PUT') return handleUpdateComplaint(request, pathArr[1]);

    // Subscriptions
    if (p === 'subscriptions' && method === 'POST') return handleSubscribe(request);
    if (p === 'subscriptions' && method === 'GET') return handleGetSubscription(request);
    if (p === 'subscriptions' && method === 'PUT') return handleUpdateSubscription(request);

    // Admin
    if (p === 'admin/stats' && method === 'GET') return handleAdminStats();
    if (p === 'admin/orders' && method === 'GET') return handleAdminOrders(request);
    if (pathArr[0] === 'admin' && pathArr[1] === 'orders' && pathArr.length === 3 && method === 'PUT') return handleUpdateBookingStatus(request, pathArr[2]);
    if (p === 'admin/complaints' && method === 'GET') return handleGetComplaints(request);
    if (pathArr[0] === 'admin' && pathArr[1] === 'complaints' && pathArr.length === 3 && method === 'PUT') return handleUpdateComplaint(request, pathArr[2]);

    return json({ error: 'Not found', path: p }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return json({ error: error.message || 'Internal server error' }, 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
