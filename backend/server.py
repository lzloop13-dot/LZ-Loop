from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Create models for requests
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: str

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

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

# Email sending function
async def send_email(to_email: str, subject: str, body: str):
    try:
        # For now, we'll just log the email. In production, configure SMTP
        logging.info(f"EMAIL TO: {to_email}")
        logging.info(f"SUBJECT: {subject}")
        logging.info(f"BODY: {body}")
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
                "price": 89.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/sujf3d6w_D410F3BB-5D94-458A-B221-F1FDEAE0BFD6.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Sunny",
                "description": "Sac vibrant jaune et blanc, inspiré des rayons du soleil méditerranéen. Fait main avec amour.",
                "price": 95.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/adrsyxm7_1D9687F2-8B7F-42FF-B292-7B0CCC1C505D.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Teddy Bear",
                "description": "Pochette d'ordinateur élégante et protectrice, tissée dans des tons naturels. Parfaite pour vos essentiels numériques.",
                "price": 65.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/profvmlb_7D33726B-66FA-448B-8287-BAFB3A03F603.PNG",
                "category": "pochette",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Classy",
                "description": "Sac sophistiqué noir et beige, alliant élégance moderne et savoir-faire traditionnel marseillais.",
                "price": 120.00,
                "image_url": "https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/13v0alzd_D171FAAA-B5AF-427B-A151-357541FCA9C3%202.PNG",
                "category": "sac",
                "created_at": datetime.now(timezone.utc)
            }
        ]
        await db.products.insert_many(initial_products)

# Product endpoints
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
    
    cart_item = CartItem(
        product_id=item.product_id,
        product_name=product["name"],
        product_price=product["price"],
        product_image=product["image_url"],
        quantity=item.quantity
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
    # Calculate shipping cost
    shipping_costs = {
        "France": 5.0,
        "Europe": 12.0,
        "International": 20.0
    }
    
    subtotal = sum(item.product_price * item.quantity for item in order_data.items)
    shipping_cost = shipping_costs.get(order_data.shipping_zone, 20.0)
    
    # Free shipping for France if order > 80€
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
    
    # Send confirmation emails
    customer_subject = "Confirmation de votre commande LZ Loop"
    customer_body = f"""
    Bonjour {order.customer_name},
    
    Merci pour votre commande chez LZ Loop !
    
    Récapitulatif de votre commande:
    - Numéro de commande: {order.id}
    - Sous-total: {subtotal:.2f}€
    - Frais de livraison: {shipping_cost:.2f}€
    - Total: {total:.2f}€
    
    Votre commande sera préparée avec soin et expédiée sous 2 à 3 jours ouvrés.
    
    Pour le paiement, veuillez effectuer un virement sur:
    RIB: [Votre RIB sera ajouté ici]
    
    Référence de paiement: {order.id}
    
    Merci de votre confiance !
    L'équipe LZ Loop
    """
    
    vendor_subject = f"Nouvelle commande - {order.id}"
    vendor_body = f"""
    Nouvelle commande reçue:
    
    Client: {order.customer_name}
    Email: {order.customer_email}
    Téléphone: {order.customer_phone}
    Adresse: {order.shipping_address}
    Zone: {order.shipping_zone}
    
    Total: {total:.2f}€
    
    Produits commandés:
    {chr(10).join([f"- {item.product_name} x{item.quantity} ({item.product_price:.2f}€)" for item in order.items])}
    """
    
    await send_email(order.customer_email, customer_subject, customer_body)
    await send_email("lzloop13@gmail.com", vendor_subject, vendor_body)
    
    # Clear cart after successful order
    await db.cart_items.delete_many({})
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find().to_list(1000)
    return [Order(**order) for order in orders]

# Contact endpoint
@api_router.post("/contact", response_model=ContactMessage)
async def create_contact(contact: ContactCreate):
    message = ContactMessage(**contact.dict())
    await db.contact_messages.insert_one(message.dict())
    
    # Send notification to vendor
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