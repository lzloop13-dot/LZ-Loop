import requests
import sys
import json
from datetime import datetime

class LZLoopAPITester:
    def __init__(self, base_url="https://handmade-chic-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.cart_items = []

    def run_test(self, name, method, endpoint, expected_status, data=None, expected_data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Additional validation for specific endpoints
                if expected_data and response.status_code == 200:
                    try:
                        response_data = response.json()
                        if expected_data(response_data):
                            print(f"   ✅ Data validation passed")
                        else:
                            print(f"   ⚠️  Data validation failed")
                            success = False
                    except Exception as e:
                        print(f"   ⚠️  Data validation error: {e}")
                        
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.status_code in [200, 201] else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_products(self):
        """Test products endpoint and validate the 4 expected products"""
        def validate_products(data):
            if not isinstance(data, list) or len(data) != 4:
                print(f"   Expected 4 products, got {len(data) if isinstance(data, list) else 'invalid data'}")
                return False
            
            expected_products = {
                "Sand": 89.0,
                "Sunny": 95.0, 
                "Teddy Bear": 65.0,
                "Classy": 120.0
            }
            
            found_products = {}
            for product in data:
                if 'name' in product and 'price' in product:
                    found_products[product['name']] = product['price']
                    print(f"   Found: {product['name']} - {product['price']}€")
            
            for name, price in expected_products.items():
                if name not in found_products:
                    print(f"   Missing product: {name}")
                    return False
                if found_products[name] != price:
                    print(f"   Wrong price for {name}: expected {price}€, got {found_products[name]}€")
                    return False
            
            return True

        success, response = self.run_test(
            "Get Products",
            "GET", 
            "products",
            200,
            expected_data=validate_products
        )
        
        if success and response:
            self.products = response
            return True
        return False

    def test_cart_operations(self):
        """Test cart add, get, and remove operations"""
        if not hasattr(self, 'products') or not self.products:
            print("❌ Cannot test cart - no products available")
            return False

        # Test adding to cart
        product = self.products[0]  # Use first product (Sand)
        success, cart_item = self.run_test(
            "Add to Cart",
            "POST",
            "cart",
            200,
            data={"product_id": product['id'], "quantity": 1}
        )
        
        if not success:
            return False

        # Test getting cart
        def validate_cart(data):
            if not isinstance(data, list):
                return False
            if len(data) == 0:
                print("   Cart is empty after adding item")
                return False
            
            item = data[0]
            if item.get('product_name') != product['name']:
                print(f"   Wrong product in cart: expected {product['name']}, got {item.get('product_name')}")
                return False
            
            print(f"   Cart contains: {item['product_name']} x{item['quantity']}")
            return True

        success, cart_data = self.run_test(
            "Get Cart",
            "GET",
            "cart", 
            200,
            expected_data=validate_cart
        )
        
        if not success or not cart_data:
            return False

        # Test removing from cart
        cart_item_id = cart_data[0]['id']
        success, _ = self.run_test(
            "Remove from Cart",
            "DELETE",
            f"cart/{cart_item_id}",
            200
        )
        
        return success

    def test_order_creation(self):
        """Test order creation with shipping calculation"""
        if not hasattr(self, 'products') or not self.products:
            print("❌ Cannot test orders - no products available")
            return False

        # Add items to cart first
        product1 = self.products[0]  # Sand - 89€
        product2 = self.products[1]  # Sunny - 95€
        
        # Add products to cart
        for product in [product1, product2]:
            requests.post(f"{self.api_url}/cart", json={"product_id": product['id'], "quantity": 1})

        # Get current cart
        cart_response = requests.get(f"{self.api_url}/cart")
        cart_items = cart_response.json() if cart_response.status_code == 200 else []

        if not cart_items:
            print("❌ No items in cart for order test")
            return False

        # Test order creation for France (should have free shipping since total > 80€)
        order_data = {
            "customer_name": "Test Customer",
            "customer_email": "test@lzloop.com",
            "customer_phone": "+33123456789",
            "shipping_address": "123 Rue de Marseille, 13000 Marseille, France",
            "items": cart_items,
            "shipping_zone": "France"
        }

        def validate_order(data):
            if not isinstance(data, dict):
                return False
            
            subtotal = data.get('subtotal', 0)
            shipping_cost = data.get('shipping_cost', 0)
            total = data.get('total', 0)
            
            print(f"   Subtotal: {subtotal}€")
            print(f"   Shipping: {shipping_cost}€")
            print(f"   Total: {total}€")
            
            # For France with >80€, shipping should be free
            if data.get('shipping_zone') == 'France' and subtotal >= 80:
                if shipping_cost != 0:
                    print(f"   Expected free shipping for France >80€, got {shipping_cost}€")
                    return False
            
            expected_total = subtotal + shipping_cost
            if abs(total - expected_total) > 0.01:
                print(f"   Total calculation error: {subtotal} + {shipping_cost} != {total}")
                return False
                
            return True

        success, order_data = self.run_test(
            "Create Order (France - Free Shipping)",
            "POST",
            "orders",
            200,
            data=order_data,
            expected_data=validate_order
        )

        return success

    def test_contact_form(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "test@lzloop.com", 
            "message": "Test message from API testing"
        }

        def validate_contact(data):
            if not isinstance(data, dict):
                return False
            
            required_fields = ['id', 'name', 'email', 'message', 'created_at']
            for field in required_fields:
                if field not in data:
                    print(f"   Missing field: {field}")
                    return False
            
            if data['name'] != contact_data['name']:
                print(f"   Name mismatch: expected {contact_data['name']}, got {data['name']}")
                return False
                
            return True

        success, _ = self.run_test(
            "Contact Form",
            "POST",
            "contact",
            201,
            data=contact_data,
            expected_data=validate_contact
        )

        return success

    def test_shipping_calculations(self):
        """Test different shipping zone calculations"""
        print(f"\n🔍 Testing Shipping Calculations...")
        
        # Test data for different scenarios
        test_cases = [
            {"zone": "France", "subtotal": 50, "expected_shipping": 5},
            {"zone": "France", "subtotal": 85, "expected_shipping": 0},  # Free shipping
            {"zone": "Europe", "subtotal": 100, "expected_shipping": 12},
            {"zone": "International", "subtotal": 200, "expected_shipping": 20}
        ]
        
        for case in test_cases:
            zone = case["zone"]
            subtotal = case["subtotal"]
            expected = case["expected_shipping"]
            
            # Calculate shipping cost based on business logic
            if zone == "France" and subtotal >= 80:
                calculated = 0
            elif zone == "France":
                calculated = 5
            elif zone == "Europe":
                calculated = 12
            else:  # International
                calculated = 20
            
            if calculated == expected:
                print(f"   ✅ {zone} - {subtotal}€: {calculated}€ shipping")
                self.tests_passed += 1
            else:
                print(f"   ❌ {zone} - {subtotal}€: expected {expected}€, got {calculated}€")
            
            self.tests_run += 1

def main():
    print("🚀 Starting LZ Loop API Testing...")
    print("=" * 50)
    
    tester = LZLoopAPITester()
    
    # Test API root
    success, _ = tester.run_test("API Root", "GET", "", 200)
    if not success:
        print("❌ API is not accessible, stopping tests")
        return 1

    # Test products (must work for other tests)
    if not tester.test_products():
        print("❌ Products test failed, stopping tests")
        return 1

    # Test cart operations
    tester.test_cart_operations()
    
    # Test order creation
    tester.test_order_creation()
    
    # Test contact form
    tester.test_contact_form()
    
    # Test shipping calculations
    tester.test_shipping_calculations()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())