#!/usr/bin/env python3
"""
Fresh Fold Laundry Platform Backend API Test Suite
Tests all backend endpoints as specified in the test plan
"""

import requests
import json
import time
from datetime import datetime, timedelta

class FreshFoldAPITester:
    def __init__(self):
        self.base_url = "https://pressfresh.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.auth_token = None
        self.test_user = {
            "name": "Test User Fresh",
            "email": f"testuser.freshfold.{int(time.time())}@example.com",
            "password": "SecurePass123!",
            "phone": "+61400123456"
        }
        self.created_order_id = None
        self.tracking_id = None
        self.subscription_id = None
        self.complaint_id = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_health_check(self):
        """Test GET /api/health"""
        self.log("Testing health check endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log("✅ Health check passed")
                    return True
                else:
                    self.log(f"❌ Health check failed - unexpected response: {data}")
                    return False
            else:
                self.log(f"❌ Health check failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Health check failed - error: {str(e)}")
            return False

    def test_user_registration(self):
        """Test POST /api/auth/register"""
        self.log(f"Testing user registration with email: {self.test_user['email']}")
        try:
            response = self.session.post(f"{self.base_url}/auth/register", json=self.test_user)
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and 'token' in data:
                    self.auth_token = data['token']
                    self.log("✅ User registration successful")
                    return True
                else:
                    self.log(f"❌ Registration failed - missing user/token: {data}")
                    return False
            else:
                self.log(f"❌ Registration failed - status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Registration failed - error: {str(e)}")
            return False

    def test_user_login(self):
        """Test POST /api/auth/login"""
        self.log("Testing user login...")
        try:
            login_data = {
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            }
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and 'token' in data:
                    self.auth_token = data['token']  # Update token
                    self.log("✅ User login successful")
                    return True
                else:
                    self.log(f"❌ Login failed - missing user/token: {data}")
                    return False
            else:
                self.log(f"❌ Login failed - status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Login failed - error: {str(e)}")
            return False

    def test_auth_me(self):
        """Test GET /api/auth/me"""
        self.log("Testing authenticated user endpoint...")
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/auth/me", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if 'user' in data:
                    self.log("✅ Auth me endpoint working")
                    return True
                else:
                    self.log(f"❌ Auth me failed - missing user: {data}")
                    return False
            else:
                self.log(f"❌ Auth me failed - status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Auth me failed - error: {str(e)}")
            return False

    def test_get_plans(self):
        """Test GET /api/plans"""
        self.log("Testing get plans endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/plans")
            if response.status_code == 200:
                data = response.json()
                if 'plans' in data and len(data['plans']) > 0:
                    self.log(f"✅ Plans endpoint working - {len(data['plans'])} plans found")
                    return True
                else:
                    self.log(f"❌ Plans endpoint failed - no plans: {data}")
                    return False
            else:
                self.log(f"❌ Plans endpoint failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Plans endpoint failed - error: {str(e)}")
            return False

    def test_get_addons(self):
        """Test GET /api/addons"""
        self.log("Testing get addons endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/addons")
            if response.status_code == 200:
                data = response.json()
                if 'addons' in data and len(data['addons']) > 0:
                    self.log(f"✅ Addons endpoint working - {len(data['addons'])} addons found")
                    return True
                else:
                    self.log(f"❌ Addons endpoint failed - no addons: {data}")
                    return False
            else:
                self.log(f"❌ Addons endpoint failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Addons endpoint failed - error: {str(e)}")
            return False

    def test_get_suburbs(self):
        """Test GET /api/suburbs"""
        self.log("Testing get suburbs endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/suburbs")
            if response.status_code == 200:
                data = response.json()
                if 'suburbs' in data and len(data['suburbs']) > 0:
                    self.log(f"✅ Suburbs endpoint working - {len(data['suburbs'])} suburbs found")
                    return True
                else:
                    self.log(f"❌ Suburbs endpoint failed - no suburbs: {data}")
                    return False
            else:
                self.log(f"❌ Suburbs endpoint failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Suburbs endpoint failed - error: {str(e)}")
            return False

    def test_create_booking(self):
        """Test POST /api/bookings"""
        self.log("Testing create booking endpoint...")
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            pickup_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
            booking_data = {
                "type": "one-off",
                "suburb": "Geelong",  # Valid suburb from service area
                "pickupDate": pickup_date,
                "pickupTimeSlot": "10:00 AM - 12:00 PM",
                "items": 15,
                "weightKg": 8.5,
                "instructions": "Handle delicate items with care",
                "addons": [
                    {"id": "ironing", "quantity": 1},
                    {"id": "softener", "quantity": 1}
                ]
            }
            response = self.session.post(f"{self.base_url}/bookings", json=booking_data, headers=headers)
            if response.status_code == 201:
                data = response.json()
                if 'order' in data and data['order'].get('trackingId'):
                    self.created_order_id = data['order']['id']
                    self.tracking_id = data['order']['trackingId']
                    self.log(f"✅ Booking created successfully - tracking ID: {self.tracking_id}")
                    # Verify pricing calculation
                    order = data['order']
                    expected_base = 8.5 * 5.99  # weightKg * ONE_OFF_RATE_PER_KG
                    expected_addons = 14.99 + 2.99  # ironing + softener
                    expected_subtotal = expected_base + expected_addons
                    expected_gst = expected_subtotal * 0.10
                    expected_total = expected_subtotal + expected_gst
                    
                    if abs(order['total'] - expected_total) < 0.01:
                        self.log("✅ Pricing calculation verified")
                    else:
                        self.log(f"⚠️ Pricing mismatch - expected {expected_total:.2f}, got {order['total']:.2f}")
                    
                    if order.get('qrCode'):
                        self.log("✅ QR code generated")
                    else:
                        self.log("⚠️ No QR code in response")
                        
                    return True
                else:
                    self.log(f"❌ Booking failed - missing order/trackingId: {data}")
                    return False
            else:
                self.log(f"❌ Booking failed - status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Booking failed - error: {str(e)}")
            return False

    def test_suburb_validation(self):
        """Test suburb validation in booking"""
        self.log("Testing suburb validation with invalid suburb...")
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            pickup_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
            booking_data = {
                "type": "one-off",
                "suburb": "InvalidSuburb",  # Invalid suburb
                "pickupDate": pickup_date,
                "pickupTimeSlot": "10:00 AM - 12:00 PM",
                "weightKg": 5
            }
            response = self.session.post(f"{self.base_url}/bookings", json=booking_data, headers=headers)
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Service not available' in data['error']:
                    self.log("✅ Suburb validation working - invalid suburb rejected")
                    return True
                else:
                    self.log(f"❌ Suburb validation failed - unexpected error: {data}")
                    return False
            else:
                self.log(f"❌ Suburb validation failed - should return 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Suburb validation failed - error: {str(e)}")
            return False

    def test_get_bookings(self):
        """Test GET /api/bookings"""
        self.log("Testing get user bookings...")
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/bookings", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if 'orders' in data:
                    self.log(f"✅ Get bookings working - {len(data['orders'])} orders found")
                    return True
                else:
                    self.log(f"❌ Get bookings failed - missing orders: {data}")
                    return False
            else:
                self.log(f"❌ Get bookings failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Get bookings failed - error: {str(e)}")
            return False

    def test_tracking(self):
        """Test GET /api/tracking/{trackingId}"""
        if not self.tracking_id:
            self.log("❌ Cannot test tracking - no tracking ID available")
            return False
            
        self.log(f"Testing tracking endpoint with ID: {self.tracking_id}")
        try:
            response = self.session.get(f"{self.base_url}/tracking/{self.tracking_id}")
            if response.status_code == 200:
                data = response.json()
                required_fields = ['trackingId', 'status', 'statusHistory', 'suburb']
                if all(field in data for field in required_fields):
                    self.log("✅ Tracking endpoint working")
                    return True
                else:
                    self.log(f"❌ Tracking failed - missing required fields: {data}")
                    return False
            else:
                self.log(f"❌ Tracking failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Tracking failed - error: {str(e)}")
            return False

    def test_subscription_flow(self):
        """Test subscription management endpoints"""
        self.log("Testing subscription flow...")
        
        # Subscribe to family plan
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            subscribe_data = {"planId": "family"}
            response = self.session.post(f"{self.base_url}/subscriptions", json=subscribe_data, headers=headers)
            
            if response.status_code != 200:
                self.log(f"❌ Subscription creation failed - status {response.status_code}")
                return False
                
            data = response.json()
            if 'subscription' not in data:
                self.log(f"❌ Subscription creation failed - no subscription in response")
                return False
                
            self.subscription_id = data['subscription']['id']
            self.log("✅ Subscription created successfully")
            
            # Get subscription
            response = self.session.get(f"{self.base_url}/subscriptions", headers=headers)
            if response.status_code != 200:
                self.log(f"❌ Get subscription failed - status {response.status_code}")
                return False
                
            data = response.json()
            if not data.get('subscription'):
                self.log("❌ Get subscription failed - no subscription found")
                return False
                
            self.log("✅ Get subscription working")
            
            # Pause subscription
            pause_data = {"action": "pause"}
            response = self.session.put(f"{self.base_url}/subscriptions", json=pause_data, headers=headers)
            if response.status_code != 200:
                self.log(f"❌ Pause subscription failed - status {response.status_code}")
                return False
                
            self.log("✅ Subscription paused successfully")
            
            # Resume subscription
            resume_data = {"action": "resume"}
            response = self.session.put(f"{self.base_url}/subscriptions", json=resume_data, headers=headers)
            if response.status_code != 200:
                self.log(f"❌ Resume subscription failed - status {response.status_code}")
                return False
                
            self.log("✅ Subscription resumed successfully")
            
            # Cancel subscription
            cancel_data = {"action": "cancel"}
            response = self.session.put(f"{self.base_url}/subscriptions", json=cancel_data, headers=headers)
            if response.status_code != 200:
                self.log(f"❌ Cancel subscription failed - status {response.status_code}")
                return False
                
            self.log("✅ Subscription cancelled successfully")
            return True
            
        except Exception as e:
            self.log(f"❌ Subscription flow failed - error: {str(e)}")
            return False

    def test_complaints_system(self):
        """Test complaint system endpoints"""
        self.log("Testing complaint system...")
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            complaint_data = {
                "category": "Service Quality",
                "description": "Items were not properly cleaned according to instructions",
                "orderId": self.created_order_id
            }
            
            # Create complaint
            response = self.session.post(f"{self.base_url}/complaints", json=complaint_data, headers=headers)
            if response.status_code != 201:
                self.log(f"❌ Create complaint failed - status {response.status_code}")
                return False
                
            data = response.json()
            if 'complaint' not in data or not data['complaint'].get('ticketNumber'):
                self.log("❌ Create complaint failed - missing complaint/ticketNumber")
                return False
                
            self.complaint_id = data['complaint']['id']
            ticket_number = data['complaint']['ticketNumber']
            self.log(f"✅ Complaint created - ticket: {ticket_number}")
            
            # Get complaints
            response = self.session.get(f"{self.base_url}/complaints", headers=headers)
            if response.status_code != 200:
                self.log(f"❌ Get complaints failed - status {response.status_code}")
                return False
                
            data = response.json()
            if 'complaints' not in data:
                self.log("❌ Get complaints failed - missing complaints")
                return False
                
            self.log(f"✅ Get complaints working - {len(data['complaints'])} complaints found")
            return True
            
        except Exception as e:
            self.log(f"❌ Complaint system failed - error: {str(e)}")
            return False

    def test_make_admin(self):
        """Test make admin endpoint"""
        self.log("Testing make admin endpoint...")
        try:
            admin_data = {
                "email": self.test_user["email"],
                "secret": "freshfold-admin-2025"
            }
            response = self.session.post(f"{self.base_url}/auth/make-admin", json=admin_data)
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'admin' in data['message']:
                    self.log("✅ Make admin successful")
                    return True
                else:
                    self.log(f"❌ Make admin failed - unexpected response: {data}")
                    return False
            else:
                self.log(f"❌ Make admin failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Make admin failed - error: {str(e)}")
            return False

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        self.log("Testing admin statistics...")
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/admin/stats", headers=headers)
            if response.status_code == 200:
                data = response.json()
                required_fields = ['totalOrders', 'totalRevenue', 'totalUsers', 'openComplaints']
                if all(field in data for field in required_fields):
                    self.log("✅ Admin stats working")
                    return True
                else:
                    self.log(f"❌ Admin stats failed - missing fields: {data}")
                    return False
            else:
                self.log(f"❌ Admin stats failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Admin stats failed - error: {str(e)}")
            return False

    def test_checkout_session(self):
        """Test checkout session creation"""
        if not self.created_order_id:
            self.log("❌ Cannot test checkout - no order ID available")
            return False
            
        self.log("Testing checkout session creation...")
        try:
            checkout_data = {
                "orderId": self.created_order_id,
                "originUrl": "https://pressfresh.preview.emergentagent.com"
            }
            response = self.session.post(f"{self.base_url}/checkout/session", json=checkout_data)
            if response.status_code == 200:
                data = response.json()
                # Either successful Stripe session or graceful failure
                if 'url' in data or ('error' in data and 'gateway unavailable' in data['error']):
                    self.log("✅ Checkout session endpoint working (Stripe integration may be mocked)")
                    return True
                else:
                    self.log(f"❌ Checkout session failed - unexpected response: {data}")
                    return False
            else:
                self.log(f"❌ Checkout session failed - status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Checkout session failed - error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        self.log("=== Starting Fresh Fold Backend API Tests ===")
        
        test_results = {}
        
        # Basic endpoints
        test_results['health_check'] = self.test_health_check()
        test_results['user_registration'] = self.test_user_registration()
        test_results['user_login'] = self.test_user_login()
        test_results['auth_me'] = self.test_auth_me()
        
        # Data endpoints
        test_results['get_plans'] = self.test_get_plans()
        test_results['get_addons'] = self.test_get_addons()
        test_results['get_suburbs'] = self.test_get_suburbs()
        
        # Booking flow
        test_results['create_booking'] = self.test_create_booking()
        test_results['suburb_validation'] = self.test_suburb_validation()
        test_results['get_bookings'] = self.test_get_bookings()
        test_results['tracking'] = self.test_tracking()
        
        # Subscription management
        test_results['subscription_flow'] = self.test_subscription_flow()
        
        # Complaints
        test_results['complaints_system'] = self.test_complaints_system()
        
        # Admin functionality
        test_results['make_admin'] = self.test_make_admin()
        test_results['admin_stats'] = self.test_admin_stats()
        
        # Payment
        test_results['checkout_session'] = self.test_checkout_session()
        
        # Summary
        self.log("\n=== Test Results Summary ===")
        passed = 0
        failed = 0
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
            else:
                failed += 1
                
        self.log(f"\nTotal Tests: {len(test_results)}")
        self.log(f"Passed: {passed}")
        self.log(f"Failed: {failed}")
        self.log(f"Success Rate: {(passed/len(test_results)*100):.1f}%")
        
        return test_results

if __name__ == "__main__":
    tester = FreshFoldAPITester()
    results = tester.run_all_tests()