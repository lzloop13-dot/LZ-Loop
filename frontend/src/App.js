import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
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
  Package,
  ArrowLeft,
  CreditCard,
  Check
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
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCart();
    if (adminToken) {
      setIsAdmin(true);
    }
    
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
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

      const orderResponse = await axios.post(`${API}/orders`, orderData);
      const order = orderResponse.data;
      
      // Create payment checkout
      const currentUrl = window.location.origin;
      const checkoutData = {
        order_id: order.id,
        success_url: `${currentUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: currentUrl
      };
      
      const checkoutResponse = await axios.post(`${API}/payments/checkout`, checkoutData);
      
      // Redirect to Stripe checkout
      window.location.href = checkoutResponse.data.checkout_url;
      
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error("Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      setPaymentStatus(response.data);
      
      if (response.data.payment_status === 'paid') {
        toast.success("Paiement confirmé ! Merci pour votre commande.");
        await fetchCart(); // Cart should be empty now
      } else {
        toast.error("Paiement non confirmé");
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du paiement:', error);
      toast.error("Erreur lors de la vérification du paiement");
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
              paymentStatus={paymentStatus}
            />
          } />
          <Route path="/product/:productId" element={
            <ProductDetail 
              products={products}
              addToCart={addToCart}
              loading={loading}
              isAdmin={isAdmin}
              adminLogin={adminLogin}
              adminLogout={adminLogout}
            />
          } />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

const ProductDetail = ({ products, addToCart, loading, isAdmin, adminLogin, adminLogout }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [withCharm, setWithCharm] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const foundProduct = products.find(p => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      // Fetch product if not in products list
      fetchProduct(productId);
    }
  }, [productId, products]);

  const fetchProduct = async (id) => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      navigate('/');
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id, withCharm);
    }
  };

  const getTotalPrice = () => {
    if (!product) return 0;
    return (product.price + (withCharm ? 2 : 0)) * quantity;
  };

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige-50 to-sand-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-beige-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="text-2xl font-serif font-bold text-brown-800">LZ Loop</div>
            </div>
            {isAdmin ? (
              <Button variant="ghost" size="sm" onClick={adminLogout} className="text-brown-700">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            ) : (
              <AdminLogin adminLogin={adminLogin} />
            )}
          </div>
        </div>
      </nav>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg shadow-lg">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-brown-900 mb-4">{product.name}</h1>
              <p className="text-lg text-sand-700 leading-relaxed">{product.description}</p>
            </div>

            <div className="text-3xl font-bold text-brown-600">
              {getTotalPrice().toFixed(2)}€
              {withCharm && (
                <span className="text-lg text-sand-600 ml-2">
                  ({product.price}€ + 2€ charme)
                </span>
              )}
            </div>

            {/* Charm Option */}
            <Card className="border-beige-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="charm"
                    checked={withCharm}
                    onCheckedChange={setWithCharm}
                  />
                  <Label htmlFor="charm" className="flex items-center text-brown-700">
                    <Gem className="w-4 h-4 mr-2" />
                    Ajouter un charme (+2€)
                  </Label>
                </div>
                <p className="text-sm text-sand-600 mt-2 ml-6">
                  Personnalisez votre sac avec un élégant charme artisanal
                </p>
              </CardContent>
            </Card>

            {/* Quantity */}
            <div className="flex items-center space-x-4">
              <Label className="text-brown-900 font-medium">Quantité:</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="border-brown-300"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 border border-brown-300 rounded text-brown-900 min-w-[60px] text-center">
                  {quantity}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="border-brown-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button 
              onClick={handleAddToCart}
              disabled={loading}
              className="w-full bg-brown-600 hover:bg-brown-700 text-white py-3 text-lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Ajouter au panier - {getTotalPrice().toFixed(2)}€
            </Button>

            {/* Product Features */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="text-center p-4 bg-beige-100 rounded-lg">
                <Shield className="w-8 h-8 text-brown-600 mx-auto mb-2" />
                <h3 className="font-medium text-brown-900">Fait main</h3>
                <p className="text-sm text-sand-600">Artisanat marseillais</p>
              </div>
              <div className="text-center p-4 bg-beige-100 rounded-lg">
                <Sparkles className="w-8 h-8 text-brown-600 mx-auto mb-2" />
                <h3 className="font-medium text-brown-900">Unique</h3>
                <p className="text-sm text-sand-600">Pièce exclusive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ products, fetchProducts, adminToken }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoCodes, setPromoCodes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'sac',
    stock: 100
  });
  const [promoForm, setPromoForm] = useState({
    code: '',
    name: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'all',
    min_order_amount: 0
  });

  useEffect(() => {
    if (activeTab === 'promos') {
      fetchPromoCodes();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'contacts') {
      fetchContacts();
    }
  }, [activeTab]);

  const fetchPromoCodes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/promo-codes`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setPromoCodes(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des codes promo");
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setOrders(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des commandes");
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/contacts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setContacts(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des contacts");
    }
  };

  const handleUpdateProduct = async (productId) => {
    try {
      const updateData = {};
      Object.keys(productForm).forEach(key => {
        if (productForm[key] && productForm[key] !== '') {
          updateData[key] = ['price', 'stock'].includes(key) ? parseFloat(productForm[key]) : productForm[key];
        }
      });

      await axios.put(`${BACKEND_URL}/api/admin/products/${productId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success("Produit mis à jour");
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', image_url: '', category: 'sac', stock: 100 });
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
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock)
      };

      await axios.post(`${BACKEND_URL}/api/admin/products`, productData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success("Produit créé");
      setProductForm({ name: '', description: '', price: '', image_url: '', category: 'sac', stock: 100 });
      fetchProducts();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleCreatePromo = async () => {
    try {
      const promoData = {
        ...promoForm,
        discount_value: parseFloat(promoForm.discount_value),
        min_order_amount: parseFloat(promoForm.min_order_amount) || 0
      };

      await axios.post(`${BACKEND_URL}/api/admin/promo-codes`, promoData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success("Code promo créé");
      setPromoForm({ code: '', name: '', discount_type: 'percentage', discount_value: '', applies_to: 'all', min_order_amount: 0 });
      fetchPromoCodes();
    } catch (error) {
      toast.error("Erreur lors de la création du code promo");
    }
  };

  const togglePromoStatus = async (promoId, currentStatus) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/promo-codes/${promoId}`, {
        is_active: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success(!currentStatus ? "Code promo activé" : "Code promo désactivé");
      fetchPromoCodes();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const updateOrderStatus = async (orderId, status, trackingNumber = null) => {
    try {
      const updateData = { status };
      if (trackingNumber) updateData.tracking_number = trackingNumber;

      await axios.put(`${BACKEND_URL}/api/admin/orders/${orderId}/status`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success("Statut de commande mis à jour");
      fetchOrders();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="admin-panel p-8 bg-beige-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-brown-900 mb-8">Administration LZ Loop</h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'products', label: 'Produits', icon: Package },
            { id: 'promos', label: 'Codes Promo', icon: Star },
            { id: 'orders', label: 'Commandes', icon: ShoppingCart },
            { id: 'contacts', label: 'Messages', icon: Mail }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={`${activeTab === tab.id ? 'bg-brown-600 text-white' : 'border-brown-300 text-brown-700'}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
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
                  <div>
                    <Label>Stock</Label>
                    <Input 
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
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
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>URL de l'image</Label>
                    <Input 
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateProduct} className="mt-4 bg-brown-600 hover:bg-brown-700">
                  Créer le produit
                </Button>
              </CardContent>
            </Card>

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
                        <Input 
                          placeholder="Stock"
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
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
                        <p className="text-sm text-sand-600">Stock: {product.stock || "Non défini"}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex space-x-2">
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
                                  category: product.category,
                                  stock: (product.stock || 100).toString()
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
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Promo Codes Tab */}
        {activeTab === 'promos' && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-brown-900">Créer un code promo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Code (ex: WELCOME5)</Label>
                    <Input 
                      value={promoForm.code}
                      placeholder="WELCOME5"
                      onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <Label>Nom/Description</Label>
                    <Input 
                      value={promoForm.name}
                      placeholder="Remise de bienvenue 5%"
                      onChange={(e) => setPromoForm({...promoForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Type de remise</Label>
                    <Select value={promoForm.discount_type} onValueChange={(value) => setPromoForm({...promoForm, discount_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                        <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valeur ({promoForm.discount_type === 'percentage' ? '%' : '€'})</Label>
                    <Input 
                      type="number"
                      value={promoForm.discount_value}
                      placeholder={promoForm.discount_type === 'percentage' ? '5' : '10'}
                      onChange={(e) => setPromoForm({...promoForm, discount_value: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Commande minimum (€)</Label>
                    <Input 
                      type="number"
                      value={promoForm.min_order_amount}
                      placeholder="30"
                      onChange={(e) => setPromoForm({...promoForm, min_order_amount: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleCreatePromo} className="mt-4 bg-brown-600 hover:bg-brown-700">
                  Créer le code promo
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promoCodes.map((promo) => (
                <Card key={promo.id} className="border-brown-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-serif font-bold text-brown-900 text-lg">{promo.code}</h3>
                        <p className="text-sand-600 text-sm">{promo.name}</p>
                      </div>
                      <Badge variant={promo.is_active ? "default" : "secondary"}>
                        {promo.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-sand-600">Remise:</span>
                        <span className="font-medium">
                          {promo.discount_value}{promo.discount_type === 'percentage' ? '%' : '€'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-sand-600">Minimum:</span>
                        <span className="font-medium">{promo.min_order_amount}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-sand-600">Utilisations:</span>
                        <span className="font-medium">
                          {promo.current_uses}{promo.max_uses ? `/${promo.max_uses}` : ''}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                      variant={promo.is_active ? "outline" : "default"}
                      className={promo.is_active ? "border-red-300 text-red-700 hover:bg-red-50" : "bg-green-600 hover:bg-green-700"}
                      size="sm"
                    >
                      {promo.is_active ? "Désactiver" : "Activer"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="border-brown-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-brown-900">Commande #{order.id.slice(0, 8)}</h3>
                      <p className="text-sand-600">{order.customer_name} - {order.customer_email}</p>
                      <p className="text-sm text-sand-600">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-brown-600">{order.total}€</div>
                      <Badge variant={
                        order.status === 'paid' ? 'default' : 
                        order.status === 'shipped' ? 'secondary' : 
                        order.status === 'delivered' ? 'outline' : 'destructive'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Produits commandés:</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="text-sm text-sand-600">
                        - {item.product_name} x{item.quantity} 
                        {item.with_charm && " + Charme"} = {item.total_price}€
                      </div>
                    ))}
                    {order.promo_code && (
                      <div className="text-sm text-green-600 mt-2">
                        Code promo: {order.promo_code} (-{order.promo_discount}€)
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Select 
                      value={order.status}
                      onValueChange={(status) => updateOrderStatus(order.id, status)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="shipped">Expédié</SelectItem>
                        <SelectItem value="delivered">Livré</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-4 text-sm text-sand-600">
                    <p><strong>Adresse:</strong> {order.shipping_address}</p>
                    <p><strong>Zone:</strong> {order.shipping_zone}</p>
                    <p><strong>Téléphone:</strong> {order.customer_phone}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {contacts.map((contact) => (
              <Card key={contact.id} className="border-brown-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-brown-900">{contact.name}</h3>
                      <p className="text-sand-600">{contact.email}</p>
                      <p className="text-sm text-sand-600">{new Date(contact.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Badge variant={contact.status === 'read' ? 'secondary' : 'default'}>
                      {contact.status === 'read' ? 'Lu' : 'Non lu'}
                    </Badge>
                  </div>
                  <p className="text-sand-700">{contact.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
  adminToken,
  paymentStatus
}) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const navigate = useNavigate();
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
      <Card 
        className={`group cursor-pointer border-none shadow-lg hover:shadow-xl transition-all duration-300 ${isShop ? '' : 'transform hover:scale-105'} bg-white`}
        onClick={() => navigate(`/product/${product.id}`)}
      >
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
                  onCheckedChange={(checked) => {
                    setWithCharm(checked);
                    // Stop propagation to prevent navigation
                    event?.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product.id, withCharm);
                }}
                disabled={loading}
                className="bg-brown-600 hover:bg-brown-700 text-white px-6 py-2"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                }}
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
      {/* Payment Status Banner */}
      {paymentStatus && (
        <div className={`w-full py-4 px-4 text-center ${
          paymentStatus.payment_status === 'paid' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {paymentStatus.payment_status === 'paid' ? (
            <div className="flex items-center justify-center">
              <Check className="w-5 h-5 mr-2" />
              Paiement confirmé ! Merci pour votre commande.
            </div>
          ) : (
            'Paiement non confirmé'
          )}
        </div>
      )}

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
            <PromoCartContent 
              cart={cart}
              removeFromCart={removeFromCart}
              getCartTotal={getCartTotal}
              getCartCount={getCartCount}
              orderFormData={orderFormData}
              setOrderFormData={setOrderFormData}
              getShippingCost={getShippingCost}
              handleOrderSubmit={handleOrderSubmit}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default App;