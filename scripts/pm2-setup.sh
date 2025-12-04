#!/bin/bash

# Script de configuración de PM2 para BITCAN
# Ejecutar: chmod +x scripts/pm2-setup.sh && ./scripts/pm2-setup.sh

echo "🚀 Configurando PM2 para BITCAN..."

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado. Instalando..."
    npm install -g pm2
else
    echo "✅ PM2 ya está instalado"
fi

# Crear directorio de logs si no existe
if [ ! -d "logs" ]; then
    echo "📁 Creando directorio de logs..."
    mkdir -p logs
fi

# Build de producción
echo "🔨 Construyendo aplicación para producción..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build. Revisa los errores antes de continuar."
    exit 1
fi

# Iniciar con PM2
echo "▶️  Iniciando aplicación con PM2..."
pm2 start ecosystem.config.js

# Guardar configuración de PM2
echo "💾 Guardando configuración de PM2..."
pm2 save

# Configurar inicio automático
echo "⚙️  Configurando inicio automático..."
echo "Ejecuta el siguiente comando que PM2 te mostrará:"
pm2 startup

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Comandos útiles:"
echo "  - Ver estado: npm run pm2:status"
echo "  - Ver logs: npm run pm2:logs"
echo "  - Reiniciar: npm run pm2:restart"
echo "  - Detener: npm run pm2:stop"
echo ""

