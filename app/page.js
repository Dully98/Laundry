'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Sparkles, Truck, WashingMachine, ShieldCheck, Clock, Star, MapPin, ChevronRight,
  CheckCircle2, Phone, Mail, Menu, X, User, LogOut, LayoutDashboard, Package,
  AlertTriangle, Settings, CreditCard, QrCode, ChevronDown, ArrowRight, Zap,
  Heart, Timer, Shirt, Droplets, Wind, Award, Building2, Users, TrendingUp,
  DollarSign, BarChart3, Eye, FileText, Search, Filter, Loader2, Plus, Minus,
  Calendar, MessageSquare, Camera, RefreshCw, Pause, Play, XCircle, Home,
  Tag, Gift, Upload, Download, UserCheck, MapPinned, Image as ImageIcon
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ===== CONSTANTS =====
const PLANS = [
  { id: 'starter', name: 'Starter', price: 19.99, badge: null, description: 'For individuals & students', features: ['Up to 15 lbs (~7kg) per pickup','2 pickups/month','Standard wash & dry','Folding included','Real-time QR tracking'] },
  { id: 'family', name: 'Family', price: 49.99, badge: 'Most Popular', description: 'For busy households', features: ['Up to 40 lbs (~18kg) per pickup','Weekly pickups (4/month)','Premium detergents','Ironing & folding','Real-time QR tracking','Priority support','Custom wash preferences'] },
  { id: 'premium', name: 'Premium', price: 89.99, badge: 'Ultimate', description: 'For executives & high-demand', features: ['Unlimited weight','Twice-weekly (8/month)','Luxury detergents','Full ironing service','Delicate care','24/7 priority support','Same-day service'] },
];

const ADDONS = [
  { id: 'ironing', name: 'Extra Ironing Service', unit: 'per bag', price: 14.99, icon: 'Shirt' },
  { id: 'folding', name: 'Folding-Only Service', unit: 'per bag', price: 7.99, icon: 'Package' },
  { id: 'softener', name: 'Fabric Softener', unit: 'per wash', price: 2.99, icon: 'Droplets' },
  { id: 'hypoallergenic', name: 'Hypoallergenic Detergent', unit: 'per wash', price: 4.99, icon: 'ShieldCheck' },
  { id: 'stain', name: 'Heavy Stain Treatment', unit: 'per item', price: 5.99, icon: 'Sparkles' },
  { id: 'express', name: 'Express Same-Day', unit: 'per order', price: 10.99, icon: 'Zap' },
];

const SUBURBS = ['Geelong','Geelong West','Newtown','Highton','Belmont','Grovedale','Waurn Ponds','Corio','Norlane','North Geelong','South Geelong','Herne Hill','Manifold Heights','Breakwater','East Geelong','Thomson','Whittington','Newcomb','Leopold','Wallington','Ocean Grove','Barwon Heads','Torquay','Jan Juc','Anglesea','Lara','Armstrong Creek','Mount Duneed','Charlemont','Marshall','Drysdale','Clifton Springs','Portarlington','Queenscliff','Point Lonsdale'];

const TRACKING_STATUSES = ['Order Placed','Picked Up','Facility Intake','Washing','Drying','Ironing','Quality Check','Out for Delivery','Delivered'];

const TESTIMONIALS = [
  { name: 'Sarah M.', location: 'Newtown', rating: 5, text: 'Fresh Fold has been a game-changer for our family of 5. Weekly pickups, perfect folding, and the QR tracking is brilliant!' },
  { name: 'James K.', location: 'Torquay', rating: 5, text: 'As a busy professional, I needed reliable laundry care. The Premium plan gives me everything — same-day service is fantastic.' },
  { name: 'Linda P.', location: 'Ocean Grove', rating: 5, text: 'The Starter plan is perfect for me. Affordable, convenient, and the quality is superb. My clothes have never looked better.' },
  { name: 'Michael R.', location: 'Belmont', rating: 5, text: 'Running an Airbnb, I need consistent quality. Fresh Fold delivers every time. Highly recommend for property managers!' },
];

const FAQS = [
  { q: 'What if items are lost or damaged?', a: 'We take utmost care with every garment. In the rare event of loss or damage, submit a complaint through your dashboard with photos. Our team will investigate within 24 hours and process appropriate compensation or refund.' },
  { q: 'What if weight exceeds my plan limit?', a: 'We\'ll notify you before processing. You can pay the difference at our casual rate ($5.99/kg) or upgrade your plan instantly from your dashboard.' },
  { q: 'Can I pause my subscription?', a: 'Yes! You can pause your subscription for an unlimited time from your dashboard. Your plan benefits will resume when you unpause — no questions asked.' },
  { q: 'How does QR tracking work?', a: 'Each order gets a unique QR code. Scan it anytime to see real-time status updates as your laundry moves through our 9-step process — from pickup to delivery.' },
  { q: 'What if I need urgent/same-day service?', a: 'Add our Express Same-Day Service add-on ($10.99) at checkout, or upgrade to our Premium plan which includes same-day service availability.' },
  { q: 'Do you service my suburb?', a: 'We serve Greater Geelong, Bellarine Peninsula, and Surf Coast areas. Enter your suburb in our booking form to check availability instantly.' },
];

const COMPLAINT_CATEGORIES = ['Missing Item','Damaged Garment','Quality Issue','Late Delivery','Billing Issue','Other'];
const GST_RATE = 0.10;
const ONE_OFF_RATE = 5.99;

// ===== API HELPER =====
const api = async (path, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ff_token') : null;
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const res = await fetch(`/api/${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok && res.status !== 200) throw new Error(data.error || 'Request failed');
  return data;
};

// ===== ICON MAP =====
const IconMap = { Shirt, Package, Droplets, ShieldCheck, Sparkles, Zap };

// ===== NAVBAR =====
function Navbar({ view, setView, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const nav = (v) => { setView(v); setMenuOpen(false); if (v === 'home') window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg border-b' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => nav('home')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${scrolled ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700' : 'text-white'}`}>Fresh Fold</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => nav('home')} className={`text-sm font-medium transition ${scrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>Home</button>
            <a href="#pricing" className={`text-sm font-medium transition ${scrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>Pricing</a>
            <a href="#how-it-works" className={`text-sm font-medium transition ${scrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>How It Works</a>
            <a href="#service-areas" className={`text-sm font-medium transition ${scrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>Service Areas</a>
            <a href="#faq" className={`text-sm font-medium transition ${scrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}`}>FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav('dashboard')} className={`gap-2 ${scrolled ? '' : 'text-white hover:bg-white/10'}`}><LayoutDashboard className="w-4 h-4" />Dashboard</Button>
                {user.role === 'admin' && <Button variant="ghost" size="sm" onClick={() => nav('admin')} className={`gap-2 ${scrolled ? '' : 'text-white hover:bg-white/10'}`}><Settings className="w-4 h-4" />Admin</Button>}
                <Button variant="ghost" size="sm" onClick={onLogout} className={`gap-2 ${scrolled ? 'text-red-600 hover:text-red-700' : 'text-red-300 hover:text-red-200 hover:bg-white/10'}`}><LogOut className="w-4 h-4" />Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav('login')} className={scrolled ? '' : 'text-white hover:bg-white/10'}>Log In</Button>
                <Button size="sm" onClick={() => nav('register')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">Sign Up</Button>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X className={`w-6 h-6 ${scrolled ? '' : 'text-white'}`} /> : <Menu className={`w-6 h-6 ${scrolled ? '' : 'text-white'}`} />}</button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden glass border-t">
          <div className="px-4 py-3 space-y-2">
            <button onClick={() => nav('home')} className="block w-full text-left py-2 text-sm font-medium">Home</button>
            <button onClick={() => { nav('home'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block w-full text-left py-2 text-sm font-medium">Pricing</button>
            <button onClick={() => nav('booking')} className="block w-full text-left py-2 text-sm font-medium">Book Now</button>
            {user ? (
              <>
                <button onClick={() => nav('dashboard')} className="block w-full text-left py-2 text-sm font-medium">Dashboard</button>
                {user.role === 'admin' && <button onClick={() => nav('admin')} className="block w-full text-left py-2 text-sm font-medium">Admin</button>}
                <button onClick={onLogout} className="block w-full text-left py-2 text-sm font-medium text-red-600">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => nav('login')} className="block w-full text-left py-2 text-sm font-medium">Log In</button>
                <button onClick={() => nav('register')} className="block w-full text-left py-2 text-sm font-medium text-blue-600">Sign Up</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ===== LANDING PAGE SECTIONS =====
function HeroSection({ setView }) {
  const [suburb, setSuburb] = useState('');
  const [suburbValid, setSuburbValid] = useState(null);
  const checkSuburb = () => {
    if (!suburb.trim()) return;
    const valid = SUBURBS.some(s => s.toLowerCase() === suburb.toLowerCase().trim());
    setSuburbValid(valid);
    if (valid) toast.success('Great news! We service ' + suburb + '!');
    else toast.error('Sorry, we don\'t service this area yet.');
  };
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1574867908936-837aac41b552?auto=format&fit=crop&w=1920&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 mb-6 py-1.5 px-4 text-sm">Serving Greater Geelong, Bellarine & Surf Coast</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Laundry Pickup &<br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Delivery in Geelong</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/80 mb-8 max-w-2xl">Premium wash, fold & iron — delivered to your door. Plans from <span className="text-white font-semibold">$19.99/month</span>. Or book a one-off pickup anytime.</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button size="lg" onClick={() => setView('booking')} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-base px-8 py-6 rounded-xl shadow-lg shadow-blue-500/25">Start Subscription <ArrowRight className="w-5 h-5 ml-2" /></Button>
            <Button size="lg" onClick={() => setView('booking-oneoff')} className="bg-white/10 backdrop-blur border-2 border-white/40 text-white hover:bg-white/20 text-base px-8 py-6 rounded-xl font-medium">Book One-Off Pickup</Button>
          </div>
          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Enter your suburb..." value={suburb} onChange={e => { setSuburb(e.target.value); setSuburbValid(null); }} onKeyDown={e => e.key === 'Enter' && checkSuburb()} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 h-12 rounded-xl" />
            </div>
            <Button onClick={checkSuburb} className="h-12 px-6 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-semibold">Check</Button>
          </div>
          {suburbValid === true && <p className="mt-3 text-emerald-400 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> We deliver to your area!</p>}
          {suburbValid === false && <p className="mt-3 text-amber-400 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Not in our zone yet. We're expanding soon!</p>}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { icon: Calendar, title: 'Book Online', desc: 'Choose your plan or book a one-off pickup in under 60 seconds.' },
    { icon: Truck, title: 'We Pick Up', desc: 'Our driver arrives at your door at your chosen time slot.' },
    { icon: WashingMachine, title: 'We Wash & Care', desc: 'Professional wash, dry, iron & fold with premium products.' },
    { icon: Package, title: 'We Deliver Back', desc: 'Freshly cleaned clothes returned to your door, QR tracked.' },
  ];
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">Simple Process</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">Four simple steps to fresh, clean laundry — without lifting a finger.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center group">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <s.icon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">{i + 1}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-12 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><QrCode className="w-4 h-4 text-blue-500" /> QR Tracking</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Same-Day Available</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Payments</span>
        </div>
      </div>
    </section>
  );
}

function PricingSection({ setView }) {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">Transparent Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">No hidden fees. No lock-in contracts. Pause or cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={`relative overflow-hidden transition-all hover:shadow-xl ${plan.badge === 'Most Popular' ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]' : 'border border-slate-200'}`}>
              {plan.badge && <div className="absolute top-0 right-0"><Badge className={`rounded-none rounded-bl-lg ${plan.badge === 'Most Popular' ? 'bg-blue-600' : 'bg-indigo-600'} text-white`}>{plan.badge}</Badge></div>}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6"><span className="text-4xl font-extrabold text-slate-900">${plan.price}</span><span className="text-slate-500">/month</span></div>
                <ul className="space-y-2.5">
                  {plan.features.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span className="text-slate-700">{f}</span></li>)}
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setView('booking')} className={`w-full py-5 rounded-xl ${plan.badge === 'Most Popular' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' : ''}`} variant={plan.badge === 'Most Popular' ? 'default' : 'outline'}>Get Started</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center mt-10">
          <button onClick={() => setView('booking-oneoff')} className="text-blue-600 font-medium hover:underline flex items-center gap-1 mx-auto">Or book a one-off pickup — no subscription required <ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </section>
  );
}

function ValuePropSection() {
  const props = [
    { icon: Timer, title: 'Save 5+ Hours Weekly', desc: 'Reclaim your weekends. We handle the washing, drying, ironing, and folding.' },
    { icon: ShieldCheck, title: 'Hygienic & Professional', desc: 'Commercial-grade equipment, premium detergents, and strict quality control.' },
    { icon: QrCode, title: 'Real-Time QR Tracking', desc: 'Scan your unique QR code to track your laundry through our 9-step process.' },
    { icon: DollarSign, title: 'Transparent Pricing', desc: 'No hidden fees. See exactly what you pay at checkout with our live calculator.' },
    { icon: Heart, title: 'No Lock-In Contracts', desc: 'Pause, downgrade, or cancel your subscription anytime — no questions asked.' },
    { icon: Zap, title: 'Same-Day Available', desc: 'Need it fast? Add express service for same-day turnaround on any order.' },
  ];
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200">Why Fresh Fold</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">More Than Just Laundry</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">We don't just wash clothes — we give you back your time.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {props.map((p, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition">
                <p.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddOnsShowcase() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-amber-50 text-amber-700 border-amber-200">Customize Every Order</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Flexible Add-Ons</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">Tailor each order to your exact needs. Add extras at checkout.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {ADDONS.map((a) => { const Icon = IconMap[a.icon] || Sparkles; return (
            <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-blue-600" /></div>
              <div className="flex-1 min-w-0"><p className="font-medium text-slate-900 text-sm">{a.name}</p><p className="text-slate-500 text-xs">{a.unit}</p></div>
              <span className="font-semibold text-blue-600">+${a.price.toFixed(2)}</span>
            </div>
          ); })}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-amber-50 text-amber-700 border-amber-200">Customer Love</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Trusted by Geelong Locals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="border-slate-100 hover:shadow-lg transition">
              <CardContent className="pt-6">
                <div className="flex gap-0.5 mb-3">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">{t.name.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.location}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceAreaSection() {
  const areas = [
    { name: 'Geelong City', suburbs: ['Geelong','Geelong West','South Geelong','North Geelong','East Geelong'] },
    { name: 'Greater Geelong', suburbs: ['Newtown','Highton','Belmont','Grovedale','Waurn Ponds','Corio','Norlane'] },
    { name: 'Bellarine Peninsula', suburbs: ['Ocean Grove','Barwon Heads','Drysdale','Clifton Springs','Queenscliff','Portarlington','Leopold'] },
    { name: 'Surf Coast', suburbs: ['Torquay','Jan Juc','Anglesea','Lorne'] },
    { name: 'Growth Corridors', suburbs: ['Armstrong Creek','Mount Duneed','Charlemont','Marshall','Lara'] },
  ];
  return (
    <section id="service-areas" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200">Local Service</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Proudly Servicing Greater Geelong</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">From the city center to the coast, we've got you covered.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {areas.map((a, i) => (
            <Card key={i} className="border-slate-100 hover:shadow-md transition">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" />{a.name}</CardTitle></CardHeader>
              <CardContent><div className="flex flex-wrap gap-1.5">{a.suburbs.map(s => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}</div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CorporateSection({ setView }) {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 mb-6">Business Solutions</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Corporate & NDIS Plans Available</h2>
            <p className="text-blue-100/80 text-lg mb-8">Custom laundry solutions for businesses, Airbnb operators, aged care facilities, and NDIS participants. Volume discounts and dedicated account management.</p>
            <div className="space-y-3">
              {['Dedicated account manager','Volume pricing','Custom pickup schedules','Invoice billing','NDIS compliant'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-blue-100"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm">{f}</span></div>
              ))}
            </div>
            <Button onClick={() => setView('booking')} className="mt-8 bg-white text-blue-900 hover:bg-blue-50 px-8 py-5 rounded-xl font-semibold" size="lg">Contact Sales <ArrowRight className="w-5 h-5 ml-2" /></Button>
          </div>
          <div className="hidden lg:block">
            <img src="https://images.unsplash.com/photo-1546695032-98e64e4cbe0c?auto=format&fit=crop&w=600&q=80" alt="Professional laundry" className="rounded-2xl shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className="py-20 sm:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition">
                <span className="font-medium text-slate-900 pr-4">{f.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ setView }) {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start Your First Pickup Today</h2>
        <p className="text-blue-100/80 text-lg mb-8 max-w-2xl mx-auto">Limited pickup slots per suburb daily. Join hundreds of Geelong locals who have reclaimed their weekends.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => setView('booking')} className="bg-white text-blue-700 hover:bg-blue-50 px-10 py-6 rounded-xl text-base font-semibold shadow-lg">Subscribe Now</Button>
          <Button size="lg" variant="outline" onClick={() => setView('booking-oneoff')} className="bg-white/10 backdrop-blur border-2 border-white/40 text-white hover:bg-white/20 px-10 py-6 rounded-xl text-base font-medium">Book One-Off</Button>
        </div>
      </div>
    </section>
  );
}

function Footer({ setView }) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
              <span className="text-lg font-bold text-white">Fresh Fold</span>
            </div>
            <p className="text-sm leading-relaxed">Premium laundry pickup & delivery serving Greater Geelong, Bellarine Peninsula, and Surf Coast.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView('booking')} className="hover:text-white transition">Subscription Plans</button></li>
              <li><button onClick={() => setView('booking-oneoff')} className="hover:text-white transition">One-Off Booking</button></li>
              <li><button onClick={() => setView('booking')} className="hover:text-white transition">Corporate Plans</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              <li><button onClick={() => setView('tracking-lookup')} className="hover:text-white transition">Track Order</button></li>
              <li><button onClick={() => setView('dashboard')} className="hover:text-white transition">Contact Us</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 1300 FRESH FOLD</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> <span>hello@freshfold.com.au</span></li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Geelong, VIC 3220</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-slate-800" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; 2025 Fresh Fold. All rights reserved.</p>
          <div className="flex gap-4"><a href="#" className="hover:text-white">Privacy Policy</a><a href="#" className="hover:text-white">Terms & Conditions</a><a href="#" className="hover:text-white">Refund Policy</a></div>
        </div>
      </div>
    </footer>
  );
}

// ===== AUTH VIEWS =====
function AuthView({ mode, setView, setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = isLogin
        ? await api('auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
        : await api('auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) });
      localStorage.setItem('ff_token', data.token);
      localStorage.setItem('ff_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      setView('dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-20 pb-12 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center"><Sparkles className="w-6 h-6 text-white" /></div>
          <CardTitle className="text-2xl">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>{isLogin ? 'Sign in to your Fresh Fold account' : 'Join Fresh Fold today'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />}
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            {!isLogin && <Input type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />}
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isLogin ? 'Sign In' : 'Create Account'}</Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-slate-600">{isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}<button onClick={() => setView(isLogin ? 'register' : 'login')} className="text-blue-600 font-medium hover:underline">{isLogin ? 'Sign Up' : 'Log In'}</button></p>
        </CardFooter>
      </Card>
    </div>
  );
}

// ===== BOOKING VIEW =====
function BookingView({ type, setView, user }) {
  const [step, setStep] = useState(1);
  const [suburb, setSuburb] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryPref, setDeliveryPref] = useState('standard');
  const [items, setItems] = useState(1);
  const [weightKg, setWeightKg] = useState(5);
  const [instructions, setInstructions] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(type === 'subscription' ? 'family' : null);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [capacity, setCapacity] = useState(null);

  const isOneOff = type === 'one-off';
  const plan = PLANS.find(p => p.id === selectedPlan);
  const baseCost = isOneOff ? parseFloat((weightKg * ONE_OFF_RATE).toFixed(2)) : (plan?.price || 0);
  const addonsTotal = Object.entries(selectedAddons).reduce((sum, [id, qty]) => {
    const addon = ADDONS.find(a => a.id === id);
    return sum + (addon ? addon.price * qty : 0);
  }, 0);
  const rawSubtotal = parseFloat((baseCost + addonsTotal).toFixed(2));
  const subtotal = parseFloat((rawSubtotal - promoDiscount).toFixed(2));
  const gst = parseFloat((subtotal * GST_RATE).toFixed(2));
  const total = parseFloat((subtotal + gst).toFixed(2));

  const timeSlots = ['8:00 AM - 10:00 AM','10:00 AM - 12:00 PM','12:00 PM - 2:00 PM','2:00 PM - 4:00 PM','4:00 PM - 6:00 PM'];
  const suburbValid = suburb && SUBURBS.some(s => s.toLowerCase() === suburb.toLowerCase().trim());

  // Fetch capacity when suburb and date change
  useEffect(() => {
    if (suburbValid && pickupDate) {
      fetch(`/api/capacity?date=${pickupDate}&suburb=${suburb}`).then(r => r.json()).then(d => setCapacity(d.capacity)).catch(() => {});
    }
  }, [suburb, pickupDate, suburbValid]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const data = await api('promo/validate', { method: 'POST', body: JSON.stringify({ code: promoCode, subtotal: rawSubtotal }) });
      if (data.valid) { setPromoDiscount(data.discount); setPromoApplied(data.code); toast.success(`Promo applied! -$${data.discount.toFixed(2)}`); }
    } catch (e) { toast.error(e.message); setPromoDiscount(0); setPromoApplied(null); }
    finally { setPromoLoading(false); }
  };

  const toggleAddon = (id, delta) => {
    setSelectedAddons(prev => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  };

  const handleSubmit = async () => {
    if (!suburbValid) { toast.error('Please enter a valid suburb in our service area'); return; }
    if (!pickupDate || !pickupTime) { toast.error('Please select pickup date and time'); return; }
    if (!user && !guestEmail) { toast.error('Please provide your email for order updates'); return; }
    setLoading(true);
    try {
      const addonsArr = Object.entries(selectedAddons).map(([id, quantity]) => ({ id, quantity }));
      const data = await api('bookings', {
        method: 'POST',
        body: JSON.stringify({
          type: isOneOff ? 'one-off' : 'subscription', planId: selectedPlan,
          suburb, pickupDate, pickupTimeSlot: pickupTime, deliveryPreference: deliveryPref,
          items, weightKg, instructions, addons: addonsArr, promoCode: promoApplied || undefined,
          guestEmail: guestEmail || user?.email, guestName: guestName || user?.name, guestPhone,
        }),
      });
      setOrder(data.order);
      toast.success('Booking created! Tracking ID: ' + data.order.trackingId);
      setStep(3);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (!order) return;
    setPaymentLoading(true);
    try {
      const originUrl = window.location.origin;
      const data = await api('checkout/session', {
        method: 'POST',
        body: JSON.stringify({ orderId: order.id, originUrl }),
      });
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.info(data.error || 'Order confirmed! Payment can be completed later.');
      }
    } catch (err) { toast.error(err.message); }
    finally { setPaymentLoading(false); }
  };

  if (step === 3 && order) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center text-white">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-emerald-100">Tracking ID: <span className="font-mono font-bold">{order.trackingId}</span></p>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span className="text-slate-500">Service</span><p className="font-medium">{order.planName}</p></div>
                <div><span className="text-slate-500">Suburb</span><p className="font-medium">{order.suburb}</p></div>
                <div><span className="text-slate-500">Pickup</span><p className="font-medium">{order.pickupDate} @ {order.pickupTimeSlot}</p></div>
                <div><span className="text-slate-500">Total</span><p className="font-medium text-lg">${order.total.toFixed(2)} AUD</p></div>
              </div>
              {order.qrCode && <div className="text-center mb-6"><p className="text-sm text-slate-500 mb-2">Scan to track your order:</p><img src={order.qrCode} alt="QR Code" className="mx-auto w-48 h-48 rounded-xl border" /></div>}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handlePayment} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5" disabled={paymentLoading}>{paymentLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}Pay Now — ${order.total.toFixed(2)}</Button>
                <Button variant="outline" onClick={() => setView('dashboard')} className="flex-1 py-5">Go to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => setView('home')} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2"><Home className="w-4 h-4" /> Back to Home</button>
          <h1 className="text-3xl font-bold text-slate-900">{isOneOff ? 'Book One-Off Pickup' : 'Start Your Subscription'}</h1>
          <p className="text-slate-600 mt-1">{isOneOff ? 'Pay per order — no commitment required.' : 'Choose a plan and schedule your first pickup.'}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!isOneOff && step === 1 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Step 1: Choose Your Plan</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {PLANS.map(p => (
                    <button key={p.id} onClick={() => setSelectedPlan(p.id)} className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition ${selectedPlan === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div><p className="font-semibold">{p.name} {p.badge && <Badge className="ml-2 text-xs">{p.badge}</Badge>}</p><p className="text-sm text-slate-500">{p.description}</p></div>
                      <span className="text-lg font-bold">${p.price}<span className="text-sm font-normal text-slate-500">/mo</span></span>
                    </button>
                  ))}
                  <Button onClick={() => setStep(2)} disabled={!selectedPlan} className="mt-4 bg-blue-600 text-white">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </CardContent>
              </Card>
            )}
            {(isOneOff || step === 2) && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{isOneOff ? 'Booking Details' : 'Step 2: Schedule Pickup'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Suburb *</label>
                      <div className="relative">
                        <Input placeholder="e.g. Newtown" value={suburb} onChange={e => setSuburb(e.target.value)} list="suburbs-list" />
                        <datalist id="suburbs-list">{SUBURBS.map(s => <option key={s} value={s} />)}</datalist>
                      </div>
                      {suburb && !suburbValid && <p className="text-xs text-red-500 mt-1">Not in our service area</p>}
                      {suburbValid && <p className="text-xs text-emerald-600 mt-1">We service this area!</p>}
                    </div>
                    <div><label className="text-sm font-medium text-slate-700 mb-1 block">Pickup Date *</label><Input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Pickup Time Slot *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {timeSlots.map(t => {
                        const cap = capacity?.find(c => c.slot === t);
                        const full = cap && cap.available <= 0;
                        return <button key={t} onClick={() => !full && setPickupTime(t)} disabled={full} className={`p-2.5 rounded-lg border text-sm text-center transition ${full ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed' : pickupTime === t ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 hover:border-slate-300'}`}>{t}{cap && <span className={`block text-xs mt-0.5 ${full ? 'text-red-400' : cap.available <= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>{full ? 'Full' : `${cap.available} left`}</span>}</button>;
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-slate-700 mb-1 block">Number of Items</label><div className="flex items-center gap-3"><Button size="sm" variant="outline" onClick={() => setItems(Math.max(1, items - 1))}><Minus className="w-4 h-4" /></Button><span className="text-lg font-semibold w-12 text-center">{items}</span><Button size="sm" variant="outline" onClick={() => setItems(items + 1)}><Plus className="w-4 h-4" /></Button></div></div>
                    {isOneOff && <div><label className="text-sm font-medium text-slate-700 mb-1 block">Estimated Weight (kg)</label><div className="flex items-center gap-3"><Button size="sm" variant="outline" onClick={() => setWeightKg(Math.max(1, weightKg - 1))}><Minus className="w-4 h-4" /></Button><span className="text-lg font-semibold w-12 text-center">{weightKg}</span><Button size="sm" variant="outline" onClick={() => setWeightKg(weightKg + 1)}><Plus className="w-4 h-4" /></Button></div><p className="text-xs text-slate-500 mt-1">${ONE_OFF_RATE}/kg</p></div>}
                  </div>
                  <div><label className="text-sm font-medium text-slate-700 mb-1 block">Delivery Preference</label>
                    <div className="flex gap-3">
                      {[['standard','Standard Delivery'],['express','Express (Same-Day)']].map(([v, l]) => <button key={v} onClick={() => setDeliveryPref(v)} className={`flex-1 p-3 rounded-lg border text-sm text-center transition ${deliveryPref === v ? 'border-blue-500 bg-blue-50 font-medium' : 'border-slate-200'}`}>{l}</button>)}
                    </div>
                  </div>
                  <div><label className="text-sm font-medium text-slate-700 mb-1 block">Special Instructions</label><textarea className="w-full p-3 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="e.g. Delicate items, colour preferences, stain locations..." value={instructions} onChange={e => setInstructions(e.target.value)} /></div>
                  {!user && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="font-medium text-blue-900 mb-3 text-sm">Guest Checkout — or <button onClick={() => setView('login')} className="underline">log in</button> for a better experience</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input placeholder="Name *" value={guestName} onChange={e => setGuestName(e.target.value)} />
                        <Input type="email" placeholder="Email *" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                        <Input type="tel" placeholder="Phone" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {(isOneOff || step === 2) && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Add-On Services</CardTitle><CardDescription>Customize your order with optional extras</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {ADDONS.map(a => { const Icon = IconMap[a.icon] || Sparkles; const qty = selectedAddons[a.id] || 0; return (
                    <div key={a.id} className={`flex items-center gap-4 p-4 rounded-xl border transition ${qty > 0 ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-blue-600" /></div>
                      <div className="flex-1 min-w-0"><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-slate-500">{a.unit}</p></div>
                      <span className="font-medium text-sm">+${a.price.toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => toggleAddon(a.id, -1)}><Minus className="w-3 h-3" /></Button>
                        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => toggleAddon(a.id, 1)}><Plus className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ); })}
                </CardContent>
              </Card>
            )}
          </div>
          {/* Pricing Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl"><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">{isOneOff ? `One-Off (${weightKg}kg x $${ONE_OFF_RATE})` : plan?.name + ' Plan'}</span><span className="font-medium">${baseCost.toFixed(2)}</span></div>
                  {Object.entries(selectedAddons).map(([id, qty]) => { const a = ADDONS.find(x => x.id === id); return a ? <div key={id} className="flex justify-between text-sm"><span className="text-slate-600">{a.name} x{qty}</span><span className="font-medium">${(a.price * qty).toFixed(2)}</span></div> : null; })}
                  {promoApplied && <div className="flex justify-between text-sm text-emerald-600"><span className="flex items-center gap-1"><Tag className="w-3 h-3" />{promoApplied}</span><span>-${promoDiscount.toFixed(2)}</span></div>}
                  <Separator />
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">GST (10%)</span><span>${gst.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${total.toFixed(2)} AUD</span></div>
                  {/* Promo Code Input */}
                  <div className="flex gap-2">
                    <Input placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="text-sm h-9" disabled={!!promoApplied} />
                    {promoApplied ? <Button size="sm" variant="ghost" onClick={() => { setPromoCode(''); setPromoDiscount(0); setPromoApplied(null); }} className="h-9 text-xs text-red-500">Remove</Button> : <Button size="sm" onClick={applyPromo} disabled={promoLoading || !promoCode.trim()} className="h-9 bg-blue-600 text-white text-xs">{promoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}</Button>}
                  </div>
                  <Button onClick={handleSubmit} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Confirm Booking</Button>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="w-3.5 h-3.5" /> Secure checkout with Stripe</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== DASHBOARD VIEW =====
function DashboardView({ user, setView }) {
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersData, subData, compData, refData] = await Promise.all([
          api('bookings'), api('subscriptions'), api('complaints'), api('referral'),
        ]);
        setOrders(ordersData.orders || []);
        setSubscription(subData.subscription);
        setReferralCode(refData.referralCode || '');
        setComplaints(compData.complaints || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSubAction = async (action) => {
    try {
      await api('subscriptions', { method: 'PUT', body: JSON.stringify({ action }) });
      toast.success(`Subscription ${action}d!`);
      const subData = await api('subscriptions');
      setSubscription(subData.subscription);
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-600 mt-1">Manage your laundry, subscriptions, and orders.</p>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="complaints">Support</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card className="border-0 shadow-md"><CardContent className="pt-6"><p className="text-sm text-slate-500">Active Plan</p><p className="text-2xl font-bold">{subscription?.planName || 'No Plan'}</p><p className="text-sm text-slate-500">{subscription?.status === 'active' ? 'Active' : subscription?.status || 'N/A'}</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="pt-6"><p className="text-sm text-slate-500">Total Orders</p><p className="text-2xl font-bold">{orders.length}</p></CardContent></Card>
              <Card className="border-0 shadow-md"><CardContent className="pt-6"><p className="text-sm text-slate-500">Open Tickets</p><p className="text-2xl font-bold">{complaints.filter(c => c.status === 'open').length}</p></CardContent></Card>
            </div>
            <div className="flex gap-3 mb-8">
              <Button onClick={() => setView('booking')} className="bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> New Booking</Button>
              <Button variant="outline" onClick={() => setView('booking-oneoff')}><Package className="w-4 h-4 mr-2" /> One-Off Pickup</Button>
            </div>
            {referralCode && (
              <Card className="mb-8 border-blue-200 bg-blue-50"><CardContent className="pt-6 flex items-center justify-between">
                <div><p className="font-medium text-blue-900 flex items-center gap-2"><Gift className="w-4 h-4" /> Your Referral Code</p><p className="text-sm text-blue-700 mt-1">Share this code with friends for discounts!</p></div>
                <div className="flex items-center gap-2"><code className="bg-white px-4 py-2 rounded-lg font-mono font-bold text-blue-700 border border-blue-200">{referralCode}</code><Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('Copied!'); }}>Copy</Button></div>
              </CardContent></Card>
            )}
            {orders.length > 0 && (
              <Card><CardHeader><CardTitle className="text-lg">Recent Orders</CardTitle></CardHeader><CardContent>
                <div className="space-y-3">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div>
                        <div><p className="font-medium text-sm">{o.trackingId}</p><p className="text-xs text-slate-500">{o.planName} — {o.suburb}</p></div>
                      </div>
                      <div className="text-right">
                        <Badge variant={o.status === 'Delivered' ? 'default' : 'secondary'} className="text-xs">{o.status}</Badge>
                        <p className="text-xs text-slate-500 mt-1">${o.total?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="orders">
            <Card><CardHeader><CardTitle>Order History</CardTitle></CardHeader><CardContent>
              {orders.length === 0 ? <p className="text-slate-500 text-center py-8">No orders yet. <button onClick={() => setView('booking')} className="text-blue-600 underline">Book your first pickup!</button></p> :
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="p-4 rounded-xl border border-slate-100 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm">{o.trackingId}</span>
                        <Badge variant={o.paymentStatus === 'paid' ? 'default' : 'secondary'}>{o.paymentStatus}</Badge>
                      </div>
                      <Badge>{o.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-slate-600">
                      <span>{o.planName}</span><span>{o.suburb}</span><span>{o.pickupDate}</span><span className="font-medium">${o.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {o.qrCode && <img src={o.qrCode} alt="QR" className="w-16 h-16 rounded-lg border" />}
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={async () => {
                        try {
                          const { invoice } = await api(`invoices/${o.id}`);
                          const { jsPDF } = await import('jspdf');
                          const doc = new jsPDF();
                          doc.setFontSize(22); doc.setTextColor(59, 130, 246); doc.text('Fresh Fold', 20, 25);
                          doc.setFontSize(10); doc.setTextColor(100); doc.text('Premium Laundry Service | Geelong, VIC 3220', 20, 32);
                          doc.setDrawColor(200); doc.line(20, 36, 190, 36);
                          doc.setFontSize(16); doc.setTextColor(30); doc.text(`Invoice ${invoice.invoiceNumber}`, 20, 48);
                          doc.setFontSize(10); doc.setTextColor(100);
                          doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 20, 56);
                          doc.text(`Customer: ${invoice.customer.name}`, 20, 62);
                          doc.text(`Email: ${invoice.customer.email}`, 20, 68);
                          doc.text(`Suburb: ${invoice.customer.suburb}`, 20, 74);
                          doc.text(`Tracking: ${invoice.order.trackingId}`, 130, 56);
                          doc.text(`Service: ${invoice.order.planName}`, 130, 62);
                          doc.text(`Pickup: ${invoice.order.pickupDate}`, 130, 68);
                          let y = 90;
                          doc.setFillColor(240, 244, 248); doc.rect(20, y - 6, 170, 8, 'F');
                          doc.setTextColor(60); doc.setFontSize(9);
                          doc.text('Description', 22, y); doc.text('Qty', 110, y); doc.text('Price', 130, y); doc.text('Total', 160, y);
                          y += 10;
                          invoice.lineItems.forEach(item => { doc.text(item.description, 22, y); doc.text(String(item.quantity), 112, y); doc.text(`$${item.unitPrice.toFixed(2)}`, 130, y); doc.text(`$${item.total.toFixed(2)}`, 160, y); y += 7; });
                          y += 5; doc.line(20, y, 190, y); y += 8;
                          if (invoice.discount > 0) { doc.text(`Discount (${invoice.promoCode}):`, 120, y); doc.text(`-$${invoice.discount.toFixed(2)}`, 160, y); y += 7; }
                          doc.text('Subtotal:', 130, y); doc.text(`$${invoice.subtotal.toFixed(2)}`, 160, y); y += 7;
                          doc.text('GST (10%):', 130, y); doc.text(`$${invoice.gst.toFixed(2)}`, 160, y); y += 7;
                          doc.setFontSize(12); doc.setTextColor(30); doc.text('Total:', 130, y); doc.text(`$${invoice.total.toFixed(2)} AUD`, 155, y);
                          y += 15; doc.setFontSize(8); doc.setTextColor(150); doc.text('Fresh Fold Pty Ltd | ABN: 12 345 678 901 | hello@freshfold.com.au', 20, y);
                          doc.save(`FreshFold-${invoice.invoiceNumber}.pdf`);
                          toast.success('Invoice downloaded!');
                        } catch (e) { toast.error('Failed to generate invoice'); }
                      }}><Download className="w-3 h-3" /> Invoice</Button>
                    </div>
                  </div>
                ))}
              </div>}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="subscription">
            <Card><CardHeader><CardTitle>Subscription Management</CardTitle></CardHeader><CardContent>
              {subscription ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <h3 className="text-2xl font-bold">{subscription.planName} Plan</h3>
                    <p className="text-blue-100 mt-1">${subscription.price}/month — Status: {subscription.status}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div><p className="text-blue-200 text-sm">Pickups Used</p><p className="text-xl font-bold">{subscription.pickupsUsed}/{subscription.pickupsPerMonth}</p></div>
                      <div><p className="text-blue-200 text-sm">Max Weight</p><p className="text-xl font-bold">{subscription.maxWeightKg === -1 ? 'Unlimited' : subscription.maxWeightKg + 'kg'}</p></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {subscription.status === 'active' && <Button variant="outline" onClick={() => handleSubAction('pause')} className="gap-2"><Pause className="w-4 h-4" /> Pause</Button>}
                    {subscription.status === 'paused' && <Button onClick={() => handleSubAction('resume')} className="gap-2 bg-blue-600 text-white"><Play className="w-4 h-4" /> Resume</Button>}
                    <Button variant="destructive" onClick={() => { if (confirm('Are you sure you want to cancel?')) handleSubAction('cancel'); }} className="gap-2"><XCircle className="w-4 h-4" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No active subscription.</p>
                  <Button onClick={() => setView('booking')} className="bg-blue-600 text-white">Start a Subscription</Button>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="complaints">
            <ComplaintView user={user} complaints={complaints} setComplaints={setComplaints} orders={orders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ===== COMPLAINT VIEW =====
function ComplaintView({ user, complaints, setComplaints, orders }) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !description) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const data = await api('complaints', { method: 'POST', body: JSON.stringify({ category, description, orderId: orderId || null, photos }) });
      toast.success('Complaint submitted. Ticket: ' + data.complaint.ticketNumber);
      setComplaints(prev => [data.complaint, ...prev]);
      setCategory(''); setDescription(''); setOrderId(''); setPhotos([]);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Submit a Complaint</CardTitle><CardDescription>We take every issue seriously</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                  <option value="">Select category</option>
                  {COMPLAINT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Related Order</label>
                <select value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                  <option value="">Select order (optional)</option>
                  {orders?.map(o => <option key={o.id} value={o.id}>{o.trackingId} — {o.planName}</option>)}
                </select>
              </div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Description *</label><textarea className="w-full p-3 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail..." /></div>
            <div>
              <label className="text-sm font-medium mb-1 block">Photos (optional)</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 text-sm text-slate-600">
                  <Upload className="w-4 h-4" /> Upload Photos
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
                {photos.length > 0 && <span className="text-xs text-slate-500">{photos.length} photo(s)</span>}
              </div>
              {photos.length > 0 && <div className="flex gap-2 mt-2">{photos.map((p, i) => <div key={i} className="relative"><img src={p} alt="Upload" className="w-16 h-16 object-cover rounded-lg border" /><button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">x</button></div>)}</div>}
            </div>
            <Button type="submit" disabled={loading} className="bg-blue-600 text-white">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Submit Complaint</Button>
          </form>
        </CardContent>
      </Card>
      {complaints.length > 0 && (
        <Card><CardHeader><CardTitle>Your Tickets</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold">{c.ticketNumber}</span>
                  <Badge variant={c.status === 'open' ? 'destructive' : c.status === 'resolved' ? 'default' : 'secondary'}>{c.status}</Badge>
                </div>
                <p className="text-sm text-slate-700">{c.description}</p>
                <p className="text-xs text-slate-500 mt-2">{c.category} — {new Date(c.createdAt).toLocaleDateString()}</p>
                {c.resolution && <p className="text-sm text-emerald-600 mt-2 p-2 bg-emerald-50 rounded">Resolution: {c.resolution}</p>}
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ===== TRACKING VIEW =====
function TrackingView({ trackingId: initialId }) {
  const [trackingId, setTrackingId] = useState(initialId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (id) => {
    const searchId = id || trackingId;
    if (!searchId) return;
    setLoading(true); setError('');
    try {
      const result = await api(`tracking/${searchId}`);
      setData(result);
    } catch (e) { setError(e.message); setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (initialId) lookup(initialId); }, [initialId]);

  const currentIdx = data ? TRACKING_STATUSES.indexOf(data.status) : -1;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Track Your Order</h1>
        <p className="text-slate-600 text-center mb-8">Enter your tracking ID to see real-time status</p>
        <div className="flex gap-2 mb-8">
          <Input placeholder="e.g. FF-A1B2C3D4" value={trackingId} onChange={e => setTrackingId(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && lookup()} className="text-center font-mono" />
          <Button onClick={() => lookup()} disabled={loading} className="bg-blue-600 text-white px-8">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button>
        </div>
        {error && <p className="text-center text-red-500 mb-4">{error}</p>}
        {data && (
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-white">{data.trackingId}</CardTitle><p className="text-blue-100 text-sm mt-1">{data.planName} — {data.suburb}</p></div>
                <Badge className="bg-white/20 text-white border-white/30">{data.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                {TRACKING_STATUSES.map((s, i) => {
                  const done = i <= currentIdx;
                  const current = i === currentIdx;
                  const historyItem = data.statusHistory?.find(h => h.status === s);
                  return (
                    <div key={s} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'} ${current ? 'ring-4 ring-blue-200' : ''}`}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{i + 1}</span>}
                        </div>
                        {i < TRACKING_STATUSES.length - 1 && <div className={`w-0.5 h-8 ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                      </div>
                      <div className="pt-1">
                        <p className={`font-medium text-sm ${done ? 'text-slate-900' : 'text-slate-400'}`}>{s}</p>
                        {historyItem && <p className="text-xs text-slate-500">{new Date(historyItem.timestamp).toLocaleString()}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {data.qrCode && <div className="text-center"><p className="text-sm text-slate-500 mb-2">Order QR Code</p><img src={data.qrCode} alt="QR" className="mx-auto w-40 h-40 rounded-xl border" /></div>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ===== ADMIN VIEW =====
function AdminView({ user, setView }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [newDriver, setNewDriver] = useState({ name: '', phone: '', vehicle: '', zones: '' });
  const [newPromo, setNewPromo] = useState({ code: '', type: 'percentage', value: '', maxUses: '', description: '' });

  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, o, c, d, p] = await Promise.all([api('admin/stats'), api('admin/orders'), api('admin/complaints'), api('drivers'), api('promo')]);
      setStats(s); setOrders(o.orders || []); setComplaints(c.complaints || []); setDrivers(d.drivers || []); setPromos(p.promos || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const updateOrderStatus = async (orderId, status) => {
    try { await api(`bookings/${orderId}`, { method: 'PUT', body: JSON.stringify({ status }) }); toast.success(`Status: ${status}`); loadData(); } catch (e) { toast.error(e.message); }
  };

  const updateComplaintStatus = async (complaintId, status, resolution) => {
    try { await api(`complaints/${complaintId}`, { method: 'PUT', body: JSON.stringify({ status, resolution }) }); toast.success('Updated'); loadData(); } catch (e) { toast.error(e.message); }
  };

  const assignDriver = async (orderId, driverId) => {
    try { await api(`drivers/assign/${orderId}`, { method: 'POST', body: JSON.stringify({ driverId }) }); toast.success('Driver assigned'); loadData(); } catch (e) { toast.error(e.message); }
  };

  const createDriver = async () => {
    if (!newDriver.name) { toast.error('Name required'); return; }
    try { await api('drivers', { method: 'POST', body: JSON.stringify({ ...newDriver, zones: newDriver.zones.split(',').map(z => z.trim()).filter(Boolean) }) }); toast.success('Driver added'); setNewDriver({ name: '', phone: '', vehicle: '', zones: '' }); loadData(); } catch (e) { toast.error(e.message); }
  };

  const createPromo = async () => {
    if (!newPromo.code || !newPromo.value) { toast.error('Code and value required'); return; }
    try { await api('promo', { method: 'POST', body: JSON.stringify(newPromo) }); toast.success('Promo created'); setNewPromo({ code: '', type: 'percentage', value: '', maxUses: '', description: '' }); loadData(); } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1><p className="text-slate-600 mt-1">Manage orders, analytics, drivers, and operations</p></div>
          <Button onClick={loadData} variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-8"><TabsTrigger value="stats">Analytics</TabsTrigger><TabsTrigger value="orders">Orders</TabsTrigger><TabsTrigger value="complaints">Complaints</TabsTrigger><TabsTrigger value="drivers">Drivers</TabsTrigger><TabsTrigger value="promos">Promo Codes</TabsTrigger></TabsList>
          
          <TabsContent value="stats">
            {stats && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  {[
                    { label: 'Total Orders', val: stats.totalOrders, icon: Package, cls: 'text-blue-600' },
                    { label: 'Total Revenue', val: '$' + (stats.totalRevenue || 0).toFixed(2), icon: DollarSign, cls: 'text-emerald-600' },
                    { label: 'Users', val: stats.totalUsers, icon: Users, cls: 'text-purple-600' },
                    { label: 'Drivers', val: stats.totalDrivers || 0, icon: Truck, cls: 'text-indigo-600' },
                    { label: 'Promos', val: stats.activePromos || 0, icon: Tag, cls: 'text-amber-600' },
                    { label: 'Open Tickets', val: stats.openComplaints, icon: AlertTriangle, cls: 'text-red-600' },
                  ].map((s, i) => (
                    <Card key={i} className="border-0 shadow-md"><CardContent className="pt-6"><s.icon className={`w-5 h-5 mb-2 ${s.cls}`} /><p className="text-xs text-slate-500">{s.label}</p><p className="text-2xl font-bold">{s.val}</p></CardContent></Card>
                  ))}
                </div>
                
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Revenue Chart */}
                  <Card><CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader><CardContent>
                    {stats.monthlyRevenue?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.monthlyRevenue.map(m => ({ month: m._id, revenue: m.revenue, orders: m.count }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-center text-slate-400 py-12">No revenue data yet</p>}
                  </CardContent></Card>
                  
                  {/* Plan Distribution Pie */}
                  <Card><CardHeader><CardTitle className="text-base">Orders by Plan</CardTitle></CardHeader><CardContent>
                    {stats.planDistribution?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={stats.planDistribution.map(p => ({ name: p._id, value: p.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {stats.planDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-center text-slate-400 py-12">No plan data yet</p>}
                  </CardContent></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Status Breakdown */}
                  <Card><CardHeader><CardTitle className="text-base">Orders by Status</CardTitle></CardHeader><CardContent>
                    {stats.statusBreakdown?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.statusBreakdown.map(s => ({ status: s._id?.replace(/ /g, '\n') || 'Unknown', count: s.count }))} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="status" type="category" width={90} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-center text-slate-400 py-12">No status data</p>}
                  </CardContent></Card>
                  
                  {/* Top Suburbs */}
                  <Card><CardHeader><CardTitle className="text-base">Top Suburbs</CardTitle></CardHeader><CardContent>
                    {stats.suburbStats?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.suburbStats.map(s => ({ suburb: s._id || 'Unknown', orders: s.count }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="suburb" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-center text-slate-400 py-12">No suburb data</p>}
                  </CardContent></Card>
                </div>

                {/* Add-on Revenue */}
                {stats.addOnRevenue?.length > 0 && (
                  <Card className="mb-8"><CardHeader><CardTitle className="text-base">Add-On Revenue</CardTitle></CardHeader><CardContent>
                    <div className="space-y-2">
                      {stats.addOnRevenue.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-sm font-medium">{a._id}</span>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">{a.count} sold</Badge>
                            <span className="font-semibold text-sm">${a.revenue?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="orders">
            <div className="flex items-center gap-3 mb-6">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 rounded-lg border border-slate-200 text-sm"><option value="">All Statuses</option>{TRACKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <Badge variant="secondary">{filteredOrders.length} orders</Badge>
            </div>
            <div className="space-y-4">
              {filteredOrders.map(o => (
                <Card key={o.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold">{o.trackingId}</span>
                          <Badge variant={o.paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-xs">{o.paymentStatus}</Badge>
                          {o.promoCode && <Badge className="text-xs bg-emerald-100 text-emerald-700">{o.promoCode}</Badge>}
                        </div>
                        <p className="text-sm text-slate-600">{o.planName} — {o.suburb} — {o.pickupDate} @ {o.pickupTimeSlot}</p>
                        <p className="text-sm">Items: {o.items} | Weight: {o.weightKg}kg | Total: <span className="font-semibold">${o.total?.toFixed(2)}</span>{o.discount > 0 && <span className="text-emerald-600 ml-1">(saved ${o.discount?.toFixed(2)})</span>}</p>
                        {o.driverName && <p className="text-xs text-blue-600 mt-1">Driver: {o.driverName}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={o.driverId || ''} onChange={e => assignDriver(o.id, e.target.value)} className="p-2 rounded-lg border border-slate-200 text-xs">
                          <option value="">Assign Driver</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="p-2 rounded-lg border border-slate-200 text-sm">
                          {TRACKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="complaints">
            <div className="space-y-4">
              {complaints.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{c.ticketNumber}</span>
                        <Badge variant={c.status === 'open' ? 'destructive' : 'default'} className="text-xs">{c.status}</Badge>
                        <Badge variant="secondary" className="text-xs">{c.category}</Badge>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{c.description}</p>
                    <p className="text-xs text-slate-500">From: {c.userName} ({c.userEmail})</p>
                    {c.photos?.length > 0 && <div className="flex gap-2 mt-2">{c.photos.map((p, i) => <img key={i} src={p} alt="Evidence" className="w-20 h-20 object-cover rounded-lg border" />)}</div>}
                    {c.status === 'open' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => { const res = prompt('Enter resolution:'); if (res) updateComplaintStatus(c.id, 'resolved', res); }}>Resolve</Button>
                        <Button size="sm" variant="outline" onClick={() => updateComplaintStatus(c.id, 'in_progress')}>In Progress</Button>
                      </div>
                    )}
                    {c.resolution && <p className="text-sm text-emerald-600 mt-2 p-2 bg-emerald-50 rounded">Resolution: {c.resolution}</p>}
                  </CardContent>
                </Card>
              ))}
              {complaints.length === 0 && <p className="text-center text-slate-500 py-8">No complaints. Great work!</p>}
            </div>
          </TabsContent>

          <TabsContent value="drivers">
            <Card className="mb-6"><CardHeader><CardTitle className="text-lg">Add Driver</CardTitle></CardHeader><CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input placeholder="Name *" value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} />
                <Input placeholder="Phone" value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} />
                <Input placeholder="Vehicle" value={newDriver.vehicle} onChange={e => setNewDriver({...newDriver, vehicle: e.target.value})} />
                <Input placeholder="Zones (comma sep)" value={newDriver.zones} onChange={e => setNewDriver({...newDriver, zones: e.target.value})} />
              </div>
              <Button onClick={createDriver} className="mt-3 bg-blue-600 text-white"><Plus className="w-4 h-4 mr-1" /> Add Driver</Button>
            </CardContent></Card>
            <div className="space-y-3">
              {drivers.map(d => (
                <Card key={d.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-600" />{d.name} <Badge variant={d.status === 'active' ? 'default' : 'secondary'} className="text-xs">{d.status}</Badge></p>
                    <p className="text-sm text-slate-500">{d.phone} | {d.vehicle}</p>
                    <div className="flex gap-1 mt-1">{d.assignedZones?.map(z => <Badge key={z} variant="secondary" className="text-xs">{z}</Badge>)}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm"><span className="font-semibold">{d.currentOrders}</span> active</p>
                    <p className="text-xs text-slate-500">{d.totalDeliveries} total</p>
                    <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={async () => {
                      const newStatus = d.status === 'active' ? 'inactive' : 'active';
                      await api(`drivers/${d.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
                      toast.success(`Driver ${newStatus}`); loadData();
                    }}>{d.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
                  </div>
                </CardContent></Card>
              ))}
              {drivers.length === 0 && <p className="text-center text-slate-500 py-8">No drivers added yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="promos">
            <Card className="mb-6"><CardHeader><CardTitle className="text-lg">Create Promo Code</CardTitle></CardHeader><CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <Input placeholder="Code *" value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} />
                <select value={newPromo.type} onChange={e => setNewPromo({...newPromo, type: e.target.value})} className="p-2 rounded-lg border border-slate-200 text-sm"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed ($)</option></select>
                <Input placeholder="Value *" type="number" value={newPromo.value} onChange={e => setNewPromo({...newPromo, value: e.target.value})} />
                <Input placeholder="Max Uses" type="number" value={newPromo.maxUses} onChange={e => setNewPromo({...newPromo, maxUses: e.target.value})} />
                <Input placeholder="Description" value={newPromo.description} onChange={e => setNewPromo({...newPromo, description: e.target.value})} />
              </div>
              <Button onClick={createPromo} className="mt-3 bg-blue-600 text-white"><Plus className="w-4 h-4 mr-1" /> Create Code</Button>
            </CardContent></Card>
            <div className="space-y-3">
              {promos.map(p => (
                <Card key={p.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold flex items-center gap-2"><Tag className="w-4 h-4 text-amber-600" />{p.code} <Badge variant={p.active ? 'default' : 'secondary'} className="text-xs">{p.active ? 'Active' : 'Inactive'}</Badge></p>
                    <p className="text-sm text-slate-500">{p.type === 'percentage' ? `${p.value}% off` : `$${p.value} off`} {p.description && `— ${p.description}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{p.currentUses}/{p.maxUses || '∞'} uses</p>
                    <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={async () => {
                      await api(`promo/${p.id}`, { method: 'PUT' });
                      toast.success(p.active ? 'Deactivated' : 'Activated'); loadData();
                    }}>{p.active ? 'Deactivate' : 'Activate'}</Button>
                  </div>
                </CardContent></Card>
              ))}
              {promos.length === 0 && <p className="text-center text-slate-500 py-8">No promo codes yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ===== CHECKOUT SUCCESS =====
function CheckoutSuccess({ sessionId, orderId, setView }) {
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus('no_session'); return; }
    const poll = async () => {
      try {
        const data = await api(`checkout/status/${sessionId}`);
        if (data.payment_status === 'paid') { setStatus('paid'); toast.success('Payment successful!'); return; }
        if (data.status === 'expired') { setStatus('expired'); return; }
        if (attempts < 5) { setTimeout(() => setAttempts(a => a + 1), 2000); }
        else { setStatus('timeout'); }
      } catch { setStatus('error'); }
    };
    poll();
  }, [sessionId, attempts]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-20 px-4">
      <Card className="w-full max-w-md shadow-xl border-0 text-center">
        <CardContent className="pt-10 pb-8">
          {status === 'checking' && <><Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Processing Payment...</h2><p className="text-slate-500">Please wait while we confirm your payment.</p></>}
          {status === 'paid' && <><CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Payment Successful!</h2><p className="text-slate-500 mb-6">Your order has been confirmed.</p><Button onClick={() => setView('dashboard')} className="bg-blue-600 text-white">Go to Dashboard</Button></>}
          {status === 'expired' && <><XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Payment Expired</h2><p className="text-slate-500 mb-4">Your session has expired.</p><Button onClick={() => setView('home')}>Return Home</Button></>}
          {(status === 'error' || status === 'timeout' || status === 'no_session') && <><AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Payment Status Unknown</h2><p className="text-slate-500 mb-4">Please check your dashboard for order status.</p><Button onClick={() => setView('dashboard')} className="bg-blue-600 text-white">Go to Dashboard</Button></>}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [viewParams, setViewParams] = useState({});

  useEffect(() => {
    // Restore user
    const savedUser = localStorage.getItem('ff_user');
    const savedToken = localStorage.getItem('ff_token');
    if (savedUser && savedToken) {
      try { setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem('ff_user'); localStorage.removeItem('ff_token'); }
    }
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const track = params.get('track');
    const sessionId = params.get('session_id');
    const orderId = params.get('order_id');
    const cancelled = params.get('cancelled');
    if (track) { setView('tracking'); setViewParams({ trackingId: track }); }
    else if (sessionId) { setView('checkout-success'); setViewParams({ sessionId, orderId }); }
    else if (cancelled) { toast.info('Payment was cancelled. Your order is saved.'); setView('dashboard'); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
    setUser(null);
    setView('home');
    toast.success('Logged out');
  };

  const navigate = (v) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Clear URL params when navigating
    if (window.location.search) window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen">
      <Navbar view={view} setView={navigate} user={user} onLogout={handleLogout} />
      {view === 'home' && (
        <>
          <HeroSection setView={navigate} />
          <HowItWorksSection />
          <PricingSection setView={navigate} />
          <ValuePropSection />
          <AddOnsShowcase />
          <TestimonialsSection />
          <ServiceAreaSection />
          <CorporateSection setView={navigate} />
          <FAQSection />
          <FinalCTA setView={navigate} />
          <Footer setView={navigate} />
        </>
      )}
      {view === 'login' && <AuthView mode="login" setView={navigate} setUser={setUser} />}
      {view === 'register' && <AuthView mode="register" setView={navigate} setUser={setUser} />}
      {view === 'booking' && <BookingView type="subscription" setView={navigate} user={user} />}
      {view === 'booking-oneoff' && <BookingView type="one-off" setView={navigate} user={user} />}
      {view === 'dashboard' && (user ? <DashboardView user={user} setView={navigate} /> : <AuthView mode="login" setView={navigate} setUser={setUser} />)}
      {view === 'admin' && (user?.role === 'admin' ? <AdminView user={user} setView={navigate} /> : <AuthView mode="login" setView={navigate} setUser={setUser} />)}
      {view === 'tracking' && <TrackingView trackingId={viewParams.trackingId} />}
      {view === 'tracking-lookup' && <TrackingView />}
      {view === 'checkout-success' && <CheckoutSuccess sessionId={viewParams.sessionId} orderId={viewParams.orderId} setView={navigate} />}
    </div>
  );
}
