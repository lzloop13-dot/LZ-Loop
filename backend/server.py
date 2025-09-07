from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import jwt
import hashlib
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
SECRET_KEY = "lzloop_admin_secret_2024"
ADMIN_PASSWORD_HASH = "6641ffdd9ad32fb06d7e16b1056cb94e6b08578c02f7f94c8d72d5d0efd02845"  # "Allahuakbar123" hashed

# Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    image_url: str
    category: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    product_price: float
    product_image: str
    quantity: int
    with_charm: bool = False
    charm_price: float = 0.0
    total_price: float
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    shipping_address: str
    items: List[CartItem]
    subtotal: float
    shipping_cost: float
    total: float
    shipping_zone: str  # France, Europe, International
    status: str = "pending"
    payment_session_id: Optional[str] = None
    payment_status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    amount: float
    currency: str = "eur"
    customer_email: str
    customer_name: str
    order_id: str
    payment_status: str = "pending"
    stripe_status: str = "initiated"
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Admin Models
class AdminLogin(BaseModel):
    password: str

class AdminToken(BaseModel):
    access_token: str
    token_type: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    category: Optional[str] = None

# Request Models
class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1
    with_charm: bool = False

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    shipping_address: str
    items: List[CartItem]
    shipping_zone: str

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    message: str

class CheckoutRequest(BaseModel):
    order_id: str
    success_url: str
    cancel_url: str

# Admin Authentication
def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        if payload.get("admin") != True:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired, please login again")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")

# Email sending function (improved)
async def send_email(to_email: str, subject: str, body: str):
    try:
        # For now, we'll just log the email. In production, configure SMTP
        logging.info(f"EMAIL TO: {to_email}")
        logging.info(f"SUBJECT: {subject}")
        logging.info(f"BODY: {body}")
        
        # TODO: Implement real email sending with SendGrid
        # from emergentintegrations.email import send_email as send_real_email
        # result = await send_real_email(to_email, subject, body)
        
        return True
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        return False

# Initialize products
@api_router.on_event("startup")
async def init_products():
    # Check if products already exist
    existing_products = await db.products.find().to_list(1000)
    if len(existing_products) == 0:
        initial_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Sand",
                "description": "Sac élégant en beige naturel, tissé à la main avec des détails dorés. L'essence de l'artisanat méditerranéen.",
                "price": 35.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/sujf3d6w_D410F3BB-5D94-458A-B221-F1FDEAE0BFD6.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Sunny",
                "description": "Sac vibrant jaune et blanc, inspiré des rayons du soleil méditerranéen. Fait main avec amour.",
                "price": 40.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/adrsyxm7_1D9687F2-8B7F-42FF-B292-7B0CCC1C505D.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Teddy Bear",
                "description": "Pochette d'ordinateur élégante et protectrice, tissée dans des tons naturels. Parfaite pour vos essentiels numériques.",
                "price": 35.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/profvmlb_7D33726B-66FA-448B-8287-BAFB3A03F603.PNG",
                "category": "pochette",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Classy",
                "description": "Sac sophistiqué noir et beige, alliant élégance moderne et savoir-faire traditionnel marseillais.",
                "price": 35.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/13v0alzd_D171FAAA-B5AF-427B-A151-357541FCA9C3%202.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Candy",
                "description": "Sac rose fuchsia éclatant, tissé à la main pour apporter une touche de couleur à votre quotidien.",
                "price": 35.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/jxvs3q03_89A970F2-818C-480A-A346-7A647310DC68.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Lollipop",
                "description": "Sac aux tons vert et violet, unique et coloré. Un mélange parfait entre modernité et artisanat traditionnel.",
                "price": 35.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/1eby2bgd_5D18E2E9-3034-465B-8568-E752C6EB58F9.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mykonos",
                "description": "Sac bleu et blanc inspiré des îles grecques, tissé à la main avec l'esprit méditerranéen authentique.",
                "price": 35.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/ssq0gix4_3DB6CC4D-7271-4A23-9F0E-4D6BCE171DF1.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Jenny",
                "description": "Sac bleu 100% fait de jean recyclé. Éco-responsable et stylé, parfait pour un look décontracté.",
                "price": 40.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/lwi6dv9b_B8648C98-FCA4-4188-B2E3-99E9C8D36302.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mermaid",
                "description": "Sac aux couleurs marines et apaisantes, tissé à la main pour capturer l'esprit de la mer Méditerranée.",
                "price": 35.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/dhm61hyy_055F2606-20B6-4790-8B40-EA1BD38FC13D.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            }
        ]
        await db.products.insert_many(initial_products)

# Stripe Integration
stripe_api_key = os.environ.get('STRIPE_API_KEY')
if not stripe_api_key:
    logging.warning("STRIPE_API_KEY not found in environment variables")

# Admin Authentication Endpoints
@api_router.post("/admin/login", response_model=AdminToken)
async def admin_login(login_data: AdminLogin):
    # Hash the provided password
    password_hash = hashlib.sha256(login_data.password.encode()).hexdigest()
    
    if password_hash != ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    
    # Create JWT token (valid for 7 days)
    token_data = {"admin": True, "exp": datetime.now(timezone.utc).timestamp() + (7 * 24 * 3600)}  # 7 days
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    
    return AdminToken(access_token=token, token_type="bearer")

# Admin Product Management
@api_router.post("/admin/products", response_model=Product, dependencies=[Depends(verify_admin_token)])
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_dict["id"] = str(uuid.uuid4())
    product_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.products.insert_one(product_dict)
    return Product(**product_dict)

@api_router.put("/admin/products/{product_id}", response_model=Product, dependencies=[Depends(verify_admin_token)])
async def update_product(product_id: str, product_update: ProductUpdate):
    # Get existing product
    existing_product = await db.products.find_one({"id": product_id})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    # Return updated product
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/admin/products/{product_id}", dependencies=[Depends(verify_admin_token)])
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.get("/admin/orders", response_model=List[Order], dependencies=[Depends(verify_admin_token)])
async def get_admin_orders():
    orders = await db.orders.find().sort("created_at", -1).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/admin/contacts", response_model=List[ContactMessage], dependencies=[Depends(verify_admin_token)])
async def get_admin_contacts():
    contacts = await db.contact_messages.find().sort("created_at", -1).to_list(1000)
    return [ContactMessage(**contact) for contact in contacts]

# Public Product endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find().to_list(1000)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

# Cart endpoints
@api_router.post("/cart", response_model=CartItem)
async def add_to_cart(item: CartItemCreate):
    product = await db.products.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    charm_price = 2.0 if item.with_charm else 0.0
    total_price = (product["price"] + charm_price) * item.quantity
    
    cart_item = CartItem(
        product_id=item.product_id,
        product_name=product["name"],
        product_price=product["price"],
        product_image=product["image_url"],
        quantity=item.quantity,
        with_charm=item.with_charm,
        charm_price=charm_price,
        total_price=total_price
    )
    
    await db.cart_items.insert_one(cart_item.dict())
    return cart_item

@api_router.get("/cart", response_model=List[CartItem])
async def get_cart():
    cart_items = await db.cart_items.find().to_list(1000)
    return [CartItem(**item) for item in cart_items]

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str):
    result = await db.cart_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart():
    await db.cart_items.delete_many({})
    return {"message": "Cart cleared"}

# Order endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    shipping_costs = {
        "France": 5.0,
        "Europe": 12.0,
        "International": 20.0
    }
    
    subtotal = sum(item.total_price for item in order_data.items)
    shipping_cost = shipping_costs.get(order_data.shipping_zone, 20.0)
    
    if order_data.shipping_zone == "France" and subtotal >= 80:
        shipping_cost = 0.0
    
    total = subtotal + shipping_cost
    
    order = Order(
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        shipping_address=order_data.shipping_address,
        items=order_data.items,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=total,
        shipping_zone=order_data.shipping_zone
    )
    
    await db.orders.insert_one(order.dict())
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find().to_list(1000)
    return [Order(**order) for order in orders]

# Payment endpoints
@api_router.post("/payments/checkout")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    try:
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        # Get order
        order = await db.orders.find_one({"id": request.order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Initialize Stripe checkout
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Create checkout request
        checkout_request = CheckoutSessionRequest(
            amount=float(order["total"]),
            currency="eur",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "order_id": order["id"],
                "customer_email": order["customer_email"],
                "customer_name": order["customer_name"]
            }
        )
        
        # Create session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        payment_transaction = PaymentTransaction(
            session_id=session.session_id,
            amount=float(order["total"]),
            currency="eur",
            customer_email=order["customer_email"],
            customer_name=order["customer_name"],
            order_id=order["id"],
            metadata=checkout_request.metadata or {}
        )
        
        await db.payment_transactions.insert_one(payment_transaction.dict())
        
        # Update order with session ID
        await db.orders.update_one(
            {"id": request.order_id},
            {"$set": {"payment_session_id": session.session_id}}
        )
        
        return {"checkout_url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logging.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    try:
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        # Get payment transaction
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Check Stripe status
        host_url = "https://dummy-webhook-url.com"  # Placeholder
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        update_data = {
            "stripe_status": status_response.status,
            "payment_status": status_response.payment_status,
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If payment is successful, update order and send emails
        if status_response.payment_status == "paid" and transaction["payment_status"] != "paid":
            # Update order status
            await db.orders.update_one(
                {"id": transaction["order_id"]},
                {"$set": {"status": "paid", "payment_status": "paid"}}
            )
            
            # Send confirmation emails
            order = await db.orders.find_one({"id": transaction["order_id"]})
            if order:
                await send_confirmation_emails(order)
        
        return {
            "status": status_response.status,
            "payment_status": status_response.payment_status,
            "amount_total": status_response.amount_total,
            "currency": status_response.currency
        }
        
    except Exception as e:
        logging.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.event_type == "checkout.session.completed":
            # Update payment transaction
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            
            # Update order
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"status": "paid", "payment_status": "paid"}}
                )
                
                # Send confirmation emails
                order = await db.orders.find_one({"id": order_id})
                if order:
                    await send_confirmation_emails(order)
        
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def send_confirmation_emails(order):
    """Send confirmation emails to customer and vendor"""
    try:
        # Customer confirmation email
        customer_subject = "Confirmation de votre commande LZ Loop"
        
        items_text = ""
        for item in order["items"]:
            charm_text = " + Charme" if item.get("with_charm") else ""
            items_text += f"- {item['product_name']}{charm_text} x{item['quantity']} ({item['total_price']:.2f}€)\n"
        
        customer_body = f"""
        Bonjour {order['customer_name']},
        
        Merci pour votre commande chez LZ Loop. Votre paiement a été confirmé.
        
        Récapitulatif de votre commande:
        - Numéro de commande: {order['id']}
        
        Produits commandés:
        {items_text}
        
        - Sous-total: {order['subtotal']:.2f}€
        - Frais de livraison: {order['shipping_cost']:.2f}€
        - Total: {order['total']:.2f}€
        
        Votre commande sera préparée avec soin et expédiée sous 2 à 3 jours ouvrés.
        
        Merci de votre confiance.
        L'équipe LZ Loop
        """
        
        # Vendor notification email
        vendor_subject = f"Nouvelle commande payée - {order['id']}"
        vendor_body = f"""
        Nouvelle commande payée reçue:
        
        Client: {order['customer_name']}
        Email: {order['customer_email']}
        Téléphone: {order['customer_phone']}
        Adresse: {order['shipping_address']}
        Zone: {order['shipping_zone']}
        
        Total payé: {order['total']:.2f}€
        
        Produits commandés:
        {items_text}
        """
        
        await send_email(order['customer_email'], customer_subject, customer_body)
        await send_email("lzloop13@gmail.com", vendor_subject, vendor_body)
        
    except Exception as e:
        logging.error(f"Error sending confirmation emails: {e}")

# Contact endpoint
@api_router.post("/contact", response_model=ContactMessage)
async def create_contact(contact: ContactCreate):
    message = ContactMessage(**contact.dict())
    await db.contact_messages.insert_one(message.dict())
    
    subject = f"Nouveau message de contact - {contact.name}"
    body = f"""
    Nouveau message de contact:
    
    Nom: {contact.name}
    Email: {contact.email}
    Message: {contact.message}
    """
    
    await send_email("lzloop13@gmail.com", subject, body)
    
    return message

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "LZ Loop API - L'art du sac premium, fait main à Marseille"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()