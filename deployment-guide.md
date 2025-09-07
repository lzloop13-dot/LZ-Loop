# Guide de Déploiement LZ Loop

## 🎯 Votre Site est Prêt !

**URL Actuelle :** https://handmade-chic-1.preview.emergentagent.com  
**Mot de passe Admin :** `Allahuakbar123`

## 🌐 Options de Déploiement

### Option 1 : URL Personnalisée (RAPIDE - 10 minutes)

1. **Achetez votre domaine**
   - Rendez-vous sur OVH.com ou Namecheap.com
   - Achetez `lzloop.com` (environ 12€/an)

2. **Configuration DNS**
   ```
   Type: CNAME
   Nom: www
   Valeur: handmade-chic-1.preview.emergentagent.com
   
   Type: CNAME  
   Nom: @
   Valeur: handmade-chic-1.preview.emergentagent.com
   ```

3. **Attendez 24h** pour la propagation DNS

### Option 2 : Hébergement Indépendant (COMPLET)

#### Étape 1 : Serveur VPS
- **OVH VPS** (5€/mois) : https://www.ovhcloud.com/fr/vps/
- **DigitalOcean** (5$/mois) : https://www.digitalocean.com/

#### Étape 2 : Installation
```bash
# Sur votre serveur
git clone [votre-repo]
cd lz-loop-site

# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend  
cd ../frontend
npm install
npm run build
npm start
```

#### Étape 3 : Configuration Nginx
```nginx
server {
    listen 80;
    server_name lzloop.com www.lzloop.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:8001;
    }
}
```

## 📦 Fichiers Nécessaires

Tous vos fichiers sont dans ce dossier :
- `/app/backend/` - API Python
- `/app/frontend/` - Interface React
- Base de données : MongoDB (déjà configurée)

## ⚙️ Configuration Actuelle

- **9 sacs** avec vos vraies images
- **Interface admin** complète  
- **Système de panier** avec charmes
- **Notifications email** automatiques
- **Design professionnel** responsive

## 🔑 Accès Admin

1. Cliquez sur "Admin" en haut à droite
2. Mot de passe : `Allahuakbar123`
3. Vous pouvez :
   - Ajouter/modifier/supprimer des produits
   - Voir les commandes
   - Gérer tout le contenu

## 📞 Support

- Email : lzloop13@gmail.com
- Toutes les fonctionnalités sont opérationnelles
- Site prêt pour la production

## 🎉 Votre Site est 100% Fonctionnel !

Vous pouvez commencer à vendre dès maintenant avec l'URL actuelle, puis migrer vers votre domaine personnalisé quand vous l'aurez acheté.