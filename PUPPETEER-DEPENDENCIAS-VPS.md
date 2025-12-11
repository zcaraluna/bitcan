# 🔧 Instalación de Dependencias para Puppeteer en VPS

## Problema
Puppeteer requiere ciertas librerías del sistema que no vienen instaladas por defecto en servidores Linux. El error `libasound.so.2: cannot open shared object file` indica que faltan dependencias.

## Solución

### Opción 1: Instalar dependencias del sistema (Recomendado)

Ejecuta estos comandos en el VPS como root:

```bash
# Para Ubuntu/Debian
apt-get update
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
```

### Opción 2: Solo instalar libasound2 (Mínimo)

Si solo quieres resolver el error actual:

```bash
apt-get update
apt-get install -y libasound2
```

## Verificación

Después de instalar las dependencias, reinicia la aplicación:

```bash
pm2 restart bitcan
```

O si usas otro método:

```bash
# Reiniciar el servidor Next.js
npm run start
```

## Nota

He actualizado la configuración de Puppeteer para deshabilitar el audio y otras características no esenciales, lo que reduce la necesidad de algunas dependencias. Sin embargo, es recomendable instalar todas las dependencias para evitar problemas futuros.

## Configuración actualizada

La configuración de Puppeteer ahora incluye:
- `--disable-audio`: Deshabilita el audio
- `--mute-audio`: Silencia el audio
- `--no-sandbox`: Necesario para ejecutar en servidores
- `--disable-dev-shm-usage`: Evita problemas de memoria compartida
- Y otros flags para optimizar el rendimiento en servidores

