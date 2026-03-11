# 💰 SALVADA — Predicciones de fútbol con IA

App de predicciones de fútbol con datos reales de API-Football y análisis con IA.

## Deploy en Vercel (5 minutos)

### PASO 1 — Subir a GitHub
1. Creá un repo nuevo en github.com → "New repository"
2. Nombre: `salvada-app` → Public → Create
3. Subí todos estos archivos al repo

### PASO 2 — Deploy en Vercel
1. Entrá a vercel.com → "Add New Project"
2. Importá el repo `salvada-app`
3. En **Environment Variables** agregá:
   - `REACT_APP_PROXY_URL` = `https://salvada-proxy.vercel.app/api/proxy`
4. Click en **Deploy**

### PASO 3 — Instalar como app en el celular
1. Abrí la URL de Vercel en Chrome (Android) o Safari (iPhone)
2. Menú del navegador → **"Agregar a pantalla de inicio"**
3. ¡Listo! Se instala como app nativa con ícono propio 💰

## Estructura
```
salvada/
├── public/
│   ├── index.html      # HTML base con PWA meta tags
│   ├── manifest.json   # Configuración PWA
│   ├── icon-192.png    # Ícono app
│   └── icon-512.png    # Ícono app grande
├── src/
│   ├── App.jsx         # App principal
│   └── index.js        # Entry point
├── package.json
├── vercel.json
└── .env.example
```

## Proxy requerido
La app necesita el proxy de `salvada-proxy` deployado en Vercel con tu API key de api-football.com.
