import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Separator } from "./components/ui/separator";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Sparkles, 
  MapPin, 
  Mail, 
  Phone,
  Instagram,
  MessageCircle,
  Plus,
  Minus,
  X
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [products, setProducts] = useState([]);  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
    }
  };

  const addToCart = async (productId) => {
    try {
      setLoading(true);
      await axios.post(`${API}/cart`, { product_id: productId, quantity: 1 });
      await fetchCart();
      toast.success("Produit ajouté au panier !");
    } catch (error) {
      toast.error("Erreur lors de l'ajout au panier");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`);
      await fetchCart();
      toast.success("Produit retiré du panier");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product_price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const submitOrder = async (formData) => {
    try {
      setLoading(true);
      const orderData = {
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        items: cart,
        shipping_zone: formData.shippingZone
      };

      await axios.post(`${API}/orders`, orderData);
      await fetchCart();
      setIsCartOpen(false);
      toast.success("Commande confirmée ! Vous recevrez un email de confirmation.");
    } catch (error) {
      toast.error("Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  const submitContact = async (formData) => {
    try {
      setLoading(true);
      await axios.post(`${API}/contact`, formData);
      toast.success("Message envoyé ! Nous vous répondrons rapidement.");
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <LZLoopWebsite 
              products={products}
              cart={cart}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              getCartTotal={getCartTotal}
              getCartCount={getCartCount}
              submitOrder={submitOrder}
              submitContact={submitContact}
              loading={loading}
            />
          } />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

const LZLoopWebsite = ({ 
  products, 
  cart, 
  isCartOpen, 
  setIsCartOpen, 
  addToCart, 
  removeFromCart, 
  getCartTotal, 
  getCartCount, 
  submitOrder, 
  submitContact, 
  loading 
}) => {
  const [orderFormData, setOrderFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    shippingZone: 'France'
  });

  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    submitOrder(orderFormData);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    submitContact(contactFormData);
    setContactFormData({ name: '', email: '', message: '' });
  };

  const getShippingCost = (zone, subtotal) => {
    const costs = { France: 5, Europe: 12, International: 20 };
    const cost = costs[zone] || 20;
    return zone === 'France' && subtotal >= 80 ? 0 : cost;
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-50 to-terracotta-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sand-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-serif font-bold text-terracotta-800">LZ Loop</div>
              <div className="hidden md:flex space-x-6">
                <button onClick={() => scrollToSection('home')} className="text-sand-700 hover:text-terracotta-600 transition-colors">Accueil</button>
                <button onClick={() => scrollToSection('about')} className="text-sand-700 hover:text-terracotta-600 transition-colors">À propos</button>
                <button onClick={() => scrollToSection('collection')} className="text-sand-700 hover:text-terracotta-600 transition-colors">Collection</button>
                <button onClick={() => scrollToSection('shop')} className="text-sand-700 hover:text-terracotta-600 transition-colors">Boutique</button>
                <button onClick={() => scrollToSection('contact')} className="text-sand-700 hover:text-terracotta-600 transition-colors">Contact</button>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Panier
              {getCartCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-terracotta-600 text-white">
                  {getCartCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sand-100/50 to-terracotta-100/50"></div>
        <img 
          src="https://customer-assets.emergentagent.com/job_handmade-chic-1/artifacts/t31kn3kv_IMG_8196.PNG"
          alt="LZ Loop Logo"
          className="absolute inset-0 w-full h-full object-cover mix-blend-soft-light"
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-terracotta-900 mb-6 leading-tight">
            LZ Loop
          </h1>
          <p className="text-xl md:text-2xl text-terracotta-800 mb-4 font-light">
            L'art du sac premium, fait main à Marseille
          </p>
          <p className="text-lg text-sand-700 mb-8 max-w-2xl mx-auto">
            Des sacs uniques, tissés à la main avec élégance et authenticité
          </p>
          <Button 
            size="lg"
            onClick={() => scrollToSection('collection')}
            className="bg-terracotta-600 hover:bg-terracotta-700 text-white px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Découvrir la collection
          </Button>
        </div>
      </section>

      {/* À propos Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold text-terracotta-900 mb-6">Notre Histoire</h2>
              <p className="text-lg text-sand-700 mb-6 leading-relaxed">
                Née à Marseille, LZ Loop puise son inspiration dans la beauté méditerranéenne et l'art du tissage traditionnel. 
                Chaque sac est une œuvre unique, créée à la main avec des matériaux durables et éthiques.
              </p>
              <p className="text-lg text-sand-700 mb-8 leading-relaxed">
                Notre savoir-faire allie l'élégance moderne aux techniques ancestrales, dans le respect de l'environnement 
                et des artisans locaux. Inspirés par le soleil de la Méditerranée et l'esprit créatif de Marseille.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-terracotta-600">100%</div>
                  <div className="text-sand-600">Fait main</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-terracotta-600">♻️</div>
                  <div className="text-sand-600">Durable</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1719667505215-64670dcc8732?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxtZWRpdGVycmFuZWFuJTIwbGlmZXN0eWxlfGVufDB8fHx8MTc1NzIzMjM2Mnww&ixlib=rb-4.1.0&q=85"
                alt="Mediterranean lifestyle"
                className="rounded-lg shadow-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1566838217578-1903568a76d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxtYXJzZWlsbGV8ZW58MHx8fHwxNzU3MjMyMzY3fDA&ixlib=rb-4.1.0&q=85"
                alt="Marseille harbor"
                className="rounded-lg shadow-lg mt-8"
              />
              <img 
                src="https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxhcnRpc2FufGVufDB8fHx8MTc1NzIzMjM3Mnww&ixlib=rb-4.1.0&q=85"
                alt="Artisan work"
                className="rounded-lg shadow-lg -mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="py-20 bg-sand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-terracotta-900 mb-12">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { icon: <Shield className="w-12 h-12" />, title: "Durable", desc: "Matériaux éco-responsables" },
              { icon: <Heart className="w-12 h-12" />, title: "Éthique", desc: "Commerce équitable" },
              { icon: <Sparkles className="w-12 h-12" />, title: "Fait main", desc: "Artisanat traditionnel" },
              { icon: <Star className="w-12 h-12" />, title: "Élégant", desc: "Design raffiné" },
              { icon: <MapPin className="w-12 h-12" />, title: "Marseille", desc: "Esprit méditerranéen" }
            ].map((value, index) => (
              <Card key={index} className="text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardContent className="pt-6">
                  <div className="text-terracotta-600 mb-4 flex justify-center">{value.icon}</div>
                  <h3 className="font-serif font-bold text-terracotta-900 mb-2">{value.title}</h3>
                  <p className="text-sand-600 text-sm">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Collection Section */}
      <section id="collection" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-terracotta-900 mb-12">Notre Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="group cursor-pointer border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-terracotta-900 mb-2">{product.name}</h3>
                  <p className="text-sand-600 text-sm mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-terracotta-600">{product.price}€</span>
                    <Button 
                      size="sm"
                      onClick={() => scrollToSection('shop')}
                      className="bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-full"
                    >
                      Voir le produit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="py-20 bg-sand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-terracotta-900 mb-12">Boutique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-terracotta-900 text-xl">{product.name}</h3>
                      <p className="text-sand-600 mt-2">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold text-terracotta-600">{product.price}€</span>
                    <Button 
                      onClick={() => addToCart(product.id)}
                      disabled={loading}
                      className="bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-full px-6"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter au panier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Livraison Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif font-bold text-terracotta-900 mb-8">Livraison</h2>
          <p className="text-lg text-sand-700 mb-12 max-w-2xl mx-auto">
            Votre commande est préparée avec soin et expédiée sous 2 à 3 jours ouvrés.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { zone: "France", price: "5€", free: "Gratuit dès 80€", icon: "🇫🇷" },
              { zone: "Europe", price: "12€", free: "", icon: "🇪🇺" },
              { zone: "International", price: "20€", free: "", icon: "🌍" }
            ].map((shipping, index) => (
              <Card key={index} className="border-2 border-terracotta-200 hover:border-terracotta-400 transition-colors bg-white">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{shipping.icon}</div>
                  <h3 className="font-serif font-bold text-terracotta-900 text-xl mb-2">{shipping.zone}</h3>
                  <div className="text-2xl font-bold text-terracotta-600 mb-2">{shipping.price}</div>
                  {shipping.free && (
                    <div className="text-sm text-rose-600 font-medium">{shipping.free}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-sand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-terracotta-900 mb-12">Contact</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-terracotta-900">Envoyez-nous un message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom</Label>
                    <Input 
                      id="name" 
                      value={contactFormData.name}
                      onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={4}
                      value={contactFormData.message}
                      onChange={(e) => setContactFormData({...contactFormData, message: e.target.value})}
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-terracotta-600 hover:bg-terracotta-700">
                    Envoyer le message
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <div className="space-y-8">
              <Card className="border-none shadow-lg bg-white">
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-terracotta-900 mb-4">Suivez-nous</h3>
                  <div className="space-y-3">
                    <a href="https://instagram.com/lzloop" className="flex items-center text-sand-700 hover:text-terracotta-600 transition-colors">
                      <Instagram className="w-5 h-5 mr-3" />
                      @lzloop
                    </a>
                    <a href="https://tiktok.com/@lzloop" className="flex items-center text-sand-700 hover:text-terracotta-600 transition-colors">
                      <MessageCircle className="w-5 h-5 mr-3" />
                      @lzloop (TikTok)
                    </a>
                    <a href="https://snapchat.com/add/lzloop" className="flex items-center text-sand-700 hover:text-terracotta-600 transition-colors">
                      <MessageCircle className="w-5 h-5 mr-3" />
                      @lzloop (Snapchat)
                    </a>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg bg-white">
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-terracotta-900 mb-4">Contact direct</h3>
                  <div className="space-y-3">
                    <a href="mailto:lzloop13@gmail.com" className="flex items-center text-sand-700 hover:text-terracotta-600 transition-colors">
                      <Mail className="w-5 h-5 mr-3" />
                      lzloop13@gmail.com
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-terracotta-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-serif">Fait main avec amour à Marseille</p>
          <p className="text-sand-300 mt-2">© 2024 LZ Loop. Tous droits réservés.</p>
        </div>
      </footer>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-terracotta-900">Votre Panier</DialogTitle>
            <DialogDescription>
              {cart.length === 0 ? "Votre panier est vide" : `${getCartCount()} article(s) dans votre panier`}
            </DialogDescription>
          </DialogHeader>
          
          {cart.length > 0 && (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <h4 className="font-medium text-terracotta-900">{item.product_name}</h4>
                    <p className="text-sand-600">{item.product_price}€ x {item.quantity}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Sous-total:</span>
                  <span className="font-bold">{getCartTotal().toFixed(2)}€</span>
                </div>
                
                <form onSubmit={handleOrderSubmit} className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input 
                        id="firstName" 
                        value={orderFormData.firstName}
                        onChange={(e) => setOrderFormData({...orderFormData, firstName: e.target.value})}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom</Label>
                      <Input 
                        id="lastName" 
                        value={orderFormData.lastName}
                        onChange={(e) => setOrderFormData({...orderFormData, lastName: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={orderFormData.email}
                      onChange={(e) => setOrderFormData({...orderFormData, email: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      value={orderFormData.phone}
                      onChange={(e) => setOrderFormData({...orderFormData, phone: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input 
                      id="address" 
                      value={orderFormData.address}
                      onChange={(e) => setOrderFormData({...orderFormData, address: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input 
                        id="city" 
                        value={orderFormData.city}
                        onChange={(e) => setOrderFormData({...orderFormData, city: e.target.value})}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input 
                        id="postalCode" 
                        value={orderFormData.postalCode}
                        onChange={(e) => setOrderFormData({...orderFormData, postalCode: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="shippingZone">Zone de livraison</Label>
                    <Select 
                      value={orderFormData.shippingZone} 
                      onValueChange={(value) => setOrderFormData({...orderFormData, shippingZone: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Europe">Europe</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-sand-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total:</span>
                      <span>{getCartTotal().toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livraison:</span>
                      <span>{getShippingCost(orderFormData.shippingZone, getCartTotal()).toFixed(2)}€</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{(getCartTotal() + getShippingCost(orderFormData.shippingZone, getCartTotal())).toFixed(2)}€</span>
                    </div>
                    {orderFormData.shippingZone === 'France' && getCartTotal() >= 80 && (
                      <p className="text-sm text-rose-600">🎉 Livraison gratuite !</p>
                    )}
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">Informations de paiement</h4>
                    <p className="text-sm text-amber-700">
                      Après validation de votre commande, vous recevrez par email les informations pour effectuer le virement bancaire.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white"
                  >
                    Confirmer la commande
                  </Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default App;