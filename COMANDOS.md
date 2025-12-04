# ⚡ Comandos Útiles - BITCAN

## 🚀 Desarrollo

### Iniciar servidor de desarrollo
```bash
npm run dev
```
Acceso: http://localhost:3000

### Cambiar puerto
```bash
PORT=3001 npm run dev
```

### Modo watch (hot reload)
```bash
npm run dev -- --turbo
```

---

## 📦 Build y Producción

### Crear build de producción
```bash
npm run build
```

### Ejecutar en producción
```bash
npm start
```

### Build y ejecutar
```bash
npm run build && npm start
```

---

## 🧹 Mantenimiento

### Limpiar caché de Next.js
```bash
rm -rf .next
npm run dev
```

### Reinstalar dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

### Actualizar dependencias
```bash
npm update
```

### Ver versiones instaladas
```bash
npm list
```

---

## 🔍 Debugging

### Ver logs detallados
```bash
npm run dev -- --debug
```

### Analizar bundle
```bash
npm install -D @next/bundle-analyzer
npm run build
```

---

## 🗄️ Base de Datos

### Conectar a MySQL
```bash
mysql -u bitcanc_s1mple -p bitcanc_usuarios
# Contraseña: .Recalde97123
```

### Ver tablas
```sql
SHOW TABLES;
```

### Ver usuarios
```sql
SELECT id, name, email, role FROM users;
```

### Crear nuevo usuario
```sql
INSERT INTO users (name, email, password, role, email_verified, is_active) 
VALUES ('Nuevo Usuario', 'nuevo@example.com', '$2y$10$hash...', 'estudiante', 1, 1);
```

---

## 🧪 Testing (para implementar)

### Instalar Jest
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

### Ejecutar tests
```bash
npm test
```

### Tests en modo watch
```bash
npm test -- --watch
```

### Coverage
```bash
npm test -- --coverage
```

---

## 🎨 Tailwind CSS

### Ver clases generadas
```bash
npx tailwindcss -o output.css --watch
```

### Purgar CSS no usado
```bash
npm run build
# Tailwind hace esto automáticamente
```

---

## 📝 TypeScript

### Verificar tipos
```bash
npx tsc --noEmit
```

### Generar tipos para archivos específicos
```bash
npx tsc src/types/index.ts --declaration --emitDeclarationOnly
```

---

## 🔧 Utilidades Next.js

### Analizar página específica
```bash
npm run dev
# Luego acceder a: http://localhost:3000/_next/static/webpack
```

### Ver información del build
```bash
npm run build -- --profile
```

---

## 🐳 Docker (opcional)

### Crear Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Build y ejecutar
```bash
docker build -t bitcan .
docker run -p 3000:3000 bitcan
```

---

## 🌐 Deploy

### Vercel (recomendado)
```bash
npm install -g vercel
vercel login
vercel
```

### Build estático (si es posible)
```bash
# Modificar next.config.js:
# output: 'export'
npm run build
```

---

## 🔐 Seguridad

### Generar secret para JWT
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Hash de contraseña
```bash
node -e "console.log(require('bcryptjs').hashSync('miPassword', 10))"
```

---

## 📊 Monitoreo

### Ver uso de memoria
```bash
node --max-old-space-size=4096 node_modules/next/dist/bin/next dev
```

### Profiling
```bash
node --inspect node_modules/next/dist/bin/next dev
# Luego abrir: chrome://inspect
```

---

## 🛠️ Git

### Inicializar repositorio
```bash
git init
git add .
git commit -m "Initial commit: Next.js migration"
```

### Crear .gitignore
```gitignore
node_modules/
.next/
.env*.local
*.log
.DS_Store
```

### Subir a GitHub
```bash
git remote add origin https://github.com/tu-usuario/bitcan.git
git push -u origin main
```

---

## 📦 NPM Scripts Personalizados

Agregar a `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "clean": "rm -rf .next node_modules",
    "reset": "npm run clean && npm install"
  }
}
```

---

## 🔍 Búsqueda en Código

### Buscar en todos los archivos
```bash
grep -r "texto a buscar" src/
```

### Buscar archivos por nombre
```bash
find src/ -name "*.tsx"
```

### Buscar y reemplazar
```bash
find src/ -type f -exec sed -i 's/textoViejo/textoNuevo/g' {} +
```

---

## 📈 Performance

### Analizar performance
```bash
npm run build -- --profile
```

### Ver tamaño de chunks
```bash
npm run build
# Ver en .next/analyze/
```

---

## 🆘 Problemas Comunes

### Error: Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: ENOSPC (Linux)
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Error: Cannot find module
```bash
npm install
```

### Clear cache completo
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

---

## 📚 Documentación Rápida

- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Tailwind: https://tailwindcss.com/docs
- Node MySQL2: https://github.com/sidorares/node-mysql2

---

*Tip: Agrega estos comandos a scripts en package.json para acceso rápido*







