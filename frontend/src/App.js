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
import { Checkbox } from "./components/ui/checkbox";
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
  X,
  Gem,
  Settings,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Package
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [products, setProducts] = useState([]);  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'));

  useEffect(() => {
    fetchProducts();
    fetchCart();
    if (adminToken) {
      setIsAdmin(true);
    }
  }, [adminToken]);

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

  const addToCart = async (productId, withCharm = false) => {
    try {
      setLoading(true);
      await axios.post(`${API}/cart`, { 
        product_id: productId, 
        quantity: 1,
        with_charm: withCharm
      });
      await fetchCart();
      toast.success("Produit ajouté au panier");
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
    return cart.reduce((total, item) => total + item.total_price, 0);
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
      toast.success("Commande confirmée. Vous recevrez un email de confirmation.");
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
      toast.success("Message envoyé. Nous vous répondrons rapidement.");
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (password) => {
    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      const token = response.data.access_token;
      localStorage.setItem('admin_token', token);
      setAdminToken(token);
      setIsAdmin(true);
      toast.success("Connexion administrateur réussie");
    } catch (error) {
      toast.error("Mot de passe incorrect");
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
    setIsAdmin(false);
    toast.success("Déconnexion réussie");
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
              isAdmin={isAdmin}
              adminLogin={adminLogin}
              adminLogout={adminLogout}
              fetchProducts={fetchProducts}
              adminToken={adminToken}
            />
          } />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

const AdminPanel = ({ products, fetchProducts, adminToken }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'sac'
  });

  const handleUpdateProduct = async (productId) => {
    try {
      const updateData = {};
      Object.keys(productForm).forEach(key => {
        if (productForm[key] && productForm[key] !== '') {
          updateData[key] = key === 'price' ? parseFloat(productForm[key]) : productForm[key];
        }
      });

      await axios.put(`${BACKEND_URL}/api/admin/products/${productId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success("Produit mis à jour");
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', image_url: '', category: 'sac' });
      fetchProducts();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await axios.delete(`${BACKEND_URL}/api/admin/products/${productId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        toast.success("Produit supprimé");
        fetchProducts();
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const handleCreateProduct = async () => {
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price)
      };

      await axios.post(`${BACKEND_URL}/api/admin/products`, productData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success("Produit créé");
      setProductForm({ name: '', description: '', price: '', image_url: '', category: 'sac' });
      fetchProducts();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <div className="admin-panel p-8 bg-beige-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-brown-900 mb-8">Administration LZ Loop</h2>
        
        {/* Create Product Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-brown-900">Ajouter un nouveau produit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom du produit</Label>
                <Input 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Prix</Label>
                <Input 
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                />
              </div>
              <div>
                <Label>URL de l'image</Label>
                <Input 
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={productForm.category} onValueChange={(value) => setProductForm({...productForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sac">Sac</SelectItem>
                    <SelectItem value="pochette">Pochette</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateProduct} className="mt-4 bg-brown-600 hover:bg-brown-700">
              Créer le produit
            </Button>
          </CardContent>
        </Card>

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="border-brown-200">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-4">
                {editingProduct === product.id ? (
                  <div className="space-y-3">
                    <Input 
                      placeholder="Nom"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    />
                    <Input 
                      placeholder="Prix"
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    />
                    <Textarea 
                      placeholder="Description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleUpdateProduct(product.id)} className="bg-green-600 hover:bg-green-700">
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingProduct(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-serif font-bold text-brown-900">{product.name}</h3>
                    <p className="text-sand-600 text-sm mb-2">{product.description}</p>
                    <p className="text-brown-600 font-bold">{product.price}€</p>
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(product.id);
                          setProductForm({
                            name: product.name,
                            description: product.description,
                            price: product.price.toString(),
                            image_url: product.image_url,
                            category: product.category
                          });
                        }}
                        className="border-brown-300 text-brown-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminLogin = ({ adminLogin }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    adminLogin(password);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-brown-700">
          <Settings className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-brown-900">Connexion Administrateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input 
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-brown-600 hover:bg-brown-700">
            Se connecter
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
  loading,
  isAdmin,
  adminLogin,
  adminLogout,
  fetchProducts,
  adminToken
}) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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

  const ProductCard = ({ product, isShop = false }) => {
    const [withCharm, setWithCharm] = useState(false);
    const totalPrice = product.price + (withCharm ? 2 : 0);

    return (
      <Card className={`group cursor-pointer border-none shadow-lg hover:shadow-xl transition-all duration-300 ${isShop ? '' : 'transform hover:scale-105'} bg-white`}>
        <div className="aspect-square overflow-hidden rounded-t-lg">
          <img 
            src={product.image_url} 
            alt={product.name}
            className={`w-full h-full object-cover ${isShop ? 'hover:scale-105' : 'group-hover:scale-110'} transition-transform duration-500`}
          />
        </div>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="font-serif font-bold text-brown-900 text-xl mb-2">{product.name}</h3>
            <p className="text-sand-600 leading-relaxed">{product.description}</p>
          </div>
          
          {isShop && (
            <div className="mb-4 p-3 bg-beige-50 rounded-lg border border-beige-200">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`charm-${product.id}`}
                  checked={withCharm}
                  onCheckedChange={setWithCharm}
                />
                <Label htmlFor={`charm-${product.id}`} className="flex items-center text-sm text-brown-700">
                  <Gem className="w-4 h-4 mr-1" />
                  Ajouter un charme (+2€)
                </Label>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-brown-600">{totalPrice}€</span>
              {withCharm && isShop && (
                <span className="text-sm text-sand-600">
                  {product.price}€ + 2€ charme
                </span>
              )}
            </div>
            {isShop ? (
              <Button 
                onClick={() => addToCart(product.id, withCharm)}
                disabled={loading}
                className="bg-brown-600 hover:bg-brown-700 text-white px-6 py-2"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={() => scrollToSection('shop')}
                className="bg-brown-600 hover:bg-brown-700 text-white"
              >
                Voir le produit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showAdminPanel && isAdmin) {
    return <AdminPanel products={products} fetchProducts={fetchProducts} adminToken={adminToken} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige-50 to-sand-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-beige-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-serif font-bold text-brown-800">LZ Loop</div>
              <div className="hidden md:flex space-x-8">
                <button onClick={() => scrollToSection('home')} className="text-sand-700 hover:text-brown-600 transition-colors font-medium">Accueil</button>
                <button onClick={() => scrollToSection('about')} className="text-sand-700 hover:text-brown-600 transition-colors font-medium">À propos</button>
                <button onClick={() => scrollToSection('collection')} className="text-sand-700 hover:text-brown-600 transition-colors font-medium">Collection</button>
                <button onClick={() => scrollToSection('shop')} className="text-sand-700 hover:text-brown-600 transition-colors font-medium">Boutique</button>
                <button onClick={() => scrollToSection('contact')} className="text-sand-700 hover:text-brown-600 transition-colors font-medium">Contact</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin ? (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAdminPanel(true)}
                    className="text-brown-700"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Gérer les produits
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={adminLogout}
                    className="text-brown-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <AdminLogin adminLogin={adminLogin} />
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative border-brown-300 text-brown-700 hover:bg-beige-50"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Panier
                {getCartCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-brown-600 text-white">
                    {getCartCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-beige-100/60 to-sand-100/60"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-brown-900 mb-6 leading-tight">
            LZ Loop
          </h1>
          <p className="text-xl md:text-2xl text-brown-800 mb-4 font-light">
            L'art du sac premium, fait main à Marseille
          </p>
          <p className="text-lg text-sand-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Des sacs uniques, tissés à la main avec élégance et authenticité
          </p>
          <Button 
            size="lg"
            onClick={() => scrollToSection('collection')}
            className="bg-brown-600 hover:bg-brown-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Découvrir la collection
          </Button>
        </div>
      </section>

      {/* À propos Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold text-brown-900 mb-6">Notre Histoire</h2>
              <p className="text-lg text-sand-700 mb-6 leading-relaxed">
                Née à Marseille, LZ Loop puise son inspiration dans la beauté méditerranéenne et l'art du tissage traditionnel. 
                Chaque sac est une œuvre unique, créée à la main avec des matériaux durables et éthiques.
              </p>
              <p className="text-lg text-sand-700 mb-8 leading-relaxed">
                Notre savoir-faire allie l'élégance moderne aux techniques ancestrales, dans le respect de l'environnement 
                et des artisans locaux. Inspirés par le soleil de la Méditerranée et l'esprit créatif de Marseille.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brown-600 mb-2">100%</div>
                  <div className="text-sand-600">Fait main</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brown-600 mb-2">Durable</div>
                  <div className="text-sand-600">Éco-responsable</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-beige-100 rounded-lg p-8 text-center">
                <Heart className="w-12 h-12 text-brown-600 mx-auto mb-4" />
                <h3 className="font-serif font-bold text-brown-900 mb-2">Artisanal</h3>
                <p className="text-sand-600 text-sm">Fait main à Marseille</p>
              </div>
              <div className="bg-sand-100 rounded-lg p-8 text-center mt-8">
                <Sparkles className="w-12 h-12 text-brown-600 mx-auto mb-4" />
                <h3 className="font-serif font-bold text-brown-900 mb-2">Unique</h3>
                <p className="text-sand-600 text-sm">Chaque pièce est exclusive</p>
              </div>
              <div className="bg-sand-100 rounded-lg p-8 text-center -mt-8">
                <Shield className="w-12 h-12 text-brown-600 mx-auto mb-4" />
                <h3 className="font-serif font-bold text-brown-900 mb-2">Qualité</h3>
                <p className="text-sand-600 text-sm">Matériaux premium</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Section */}
      <section id="collection" className="py-20 bg-beige-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-brown-900 mb-12">Notre Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button 
              onClick={() => scrollToSection('shop')}
              className="bg-brown-600 hover:bg-brown-700 text-white px-8 py-3"
            >
              Voir toute la collection
            </Button>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-brown-900 mb-12">Boutique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isShop={true} />
            ))}
          </div>
        </div>
      </section>

      {/* Livraison Section */}
      <section className="py-20 bg-beige-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif font-bold text-brown-900 mb-8">Livraison</h2>
          <p className="text-lg text-sand-700 mb-12 max-w-2xl mx-auto">
            Votre commande est préparée avec soin et expédiée sous 2 à 3 jours ouvrés.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { zone: "France", price: "5€", free: "Gratuit dès 80€" },
              { zone: "Europe", price: "12€", free: "" },
              { zone: "International", price: "20€", free: "" }
            ].map((shipping, index) => (
              <Card key={index} className="border-2 border-brown-200 hover:border-brown-400 transition-colors bg-white">
                <CardContent className="p-6 text-center">
                  <Truck className="w-12 h-12 text-brown-600 mx-auto mb-4" />
                  <h3 className="font-serif font-bold text-brown-900 text-xl mb-2">{shipping.zone}</h3>
                  <div className="text-2xl font-bold text-brown-600 mb-2">{shipping.price}</div>
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
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center text-brown-900 mb-12">Contact</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-brown-900">Envoyez-nous un message</CardTitle>
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
                  <Button type="submit" disabled={loading} className="w-full bg-brown-600 hover:bg-brown-700">
                    Envoyer le message
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <div className="space-y-8">
              <Card className="border-none shadow-lg bg-white">
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-brown-900 mb-4">Suivez-nous</h3>
                  <div className="space-y-3">
                    <a href="https://instagram.com/lzloop" className="flex items-center text-sand-700 hover:text-brown-600 transition-colors">
                      <Instagram className="w-5 h-5 mr-3" />
                      @lzloop
                    </a>
                    <a href="https://tiktok.com/@lzloop" className="flex items-center text-sand-700 hover:text-brown-600 transition-colors">
                      <MessageCircle className="w-5 h-5 mr-3" />
                      @lzloop (TikTok)
                    </a>
                    <a href="https://snapchat.com/add/lzloop" className="flex items-center text-sand-700 hover:text-brown-600 transition-colors">
                      <MessageCircle className="w-5 h-5 mr-3" />
                      @lzloop (Snapchat)
                    </a>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg bg-white">
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-brown-900 mb-4">Contact direct</h3>
                  <div className="space-y-3">
                    <a href="mailto:lzloop13@gmail.com" className="flex items-center text-sand-700 hover:text-brown-600 transition-colors">
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
      <footer className="bg-brown-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-serif mb-2">Fait main avec amour à Marseille</p>
          <p className="text-beige-300">© 2024 LZ Loop. Tous droits réservés.</p>
        </div>
      </footer>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brown-900">Votre Panier</DialogTitle>
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
                    <h4 className="font-medium text-brown-900">{item.product_name}</h4>
                    <div className="text-sand-600">
                      <span>{item.product_price}€</span>
                      {item.with_charm && <span> + Charme (2€)</span>}
                      <span> x {item.quantity} = {item.total_price.toFixed(2)}€</span>
                    </div>
                    {item.with_charm && (
                      <div className="flex items-center text-xs text-brown-600 mt-1">
                        <Gem className="w-3 h-3 mr-1" />
                        Avec charme
                      </div>
                    )}
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
                  
                  <div className="bg-beige-50 p-4 rounded-lg space-y-2">
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
                      <p className="text-sm text-rose-600">Livraison gratuite</p>
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
                    className="w-full bg-brown-600 hover:bg-brown-700 text-white"
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