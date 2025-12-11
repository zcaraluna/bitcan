# 🔧 Instalación de Dependencias para Puppeteer en VPS

## Problema
Puppeteer usa Chrome/Chromium para generar PDFs. Chrome intenta cargar **todas** sus librerías del sistema al iniciar, incluso en modo headless y aunque no las use. El error `libasound.so.2: cannot open shared object file` ocurre porque Chrome intenta cargar esta librería (aunque no la necesite para generar PDFs) y no está instalada en el servidor.

**Nota:** Esto NO tiene que ver con usar audio para generar PDFs. Es simplemente una dependencia del sistema que Chrome necesita tener disponible, aunque no la use.

## Solución

### Instalar dependencias del sistema (Recomendado)

Ejecuta estos comandos en el VPS como root:

```bash
# Para Ubuntu/Debian
apt-get update

# Detectar versión y usar el paquete correcto de libasound
if apt-cache show libasound2t64 > /dev/null 2>&1; then
  # Ubuntu 24.04+
  apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2t64 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils
else
  # Ubuntu 22.04 o anterior
  apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils
fi
```

**O simplemente instala directamente según tu versión:**

```bash
# Ubuntu 24.04 o superior
apt-get install -y libasound2t64

# Ubuntu 22.04 o anterior  
apt-get install -y libasound2
```

### Solución rápida (solo el error actual)

Si solo quieres resolver el error inmediato:

```bash
apt-get update
# Para Ubuntu 24.04+ usa libasound2t64, para versiones anteriores usa libasound2
apt-get install -y libasound2t64 || apt-get install -y libasound2
```

O instalar explícitamente según tu versión:

```bash
# Ubuntu 24.04 o superior
apt-get install -y libasound2t64

# Ubuntu 22.04 o anterior
apt-get install -y libasound2
```

**Pero es recomendable instalar todas las dependencias** para evitar errores similares en el futuro.

## Verificación

Después de instalar las dependencias, reinicia la aplicación:

```bash
pm2 restart bitcan
```

## ¿Por qué pasa esto?

Chrome/Chromium está diseñado para funcionar como un navegador completo, por lo que intenta cargar todas sus dependencias al iniciar, incluso si:
- Está en modo headless (sin interfaz gráfica)
- Solo se usa para generar PDFs
- No se necesita audio, video, etc.

Es un comportamiento normal de Chrome y la solución es instalar las dependencias del sistema necesarias.

