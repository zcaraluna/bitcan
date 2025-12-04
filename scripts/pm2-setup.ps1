# Script de configuración de PM2 para BITCAN (PowerShell)
# Ejecutar: .\scripts\pm2-setup.ps1

Write-Host "🚀 Configurando PM2 para BITCAN..." -ForegroundColor Cyan

# Verificar si PM2 está instalado
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue

if (-not $pm2Installed) {
    Write-Host "❌ PM2 no está instalado. Instalando..." -ForegroundColor Yellow
    npm install -g pm2
} else {
    Write-Host "✅ PM2 ya está instalado" -ForegroundColor Green
}

# Crear directorio de logs si no existe
if (-not (Test-Path "logs")) {
    Write-Host "📁 Creando directorio de logs..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Build de producción
Write-Host "🔨 Construyendo aplicación para producción..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build. Revisa los errores antes de continuar." -ForegroundColor Red
    exit 1
}

# Iniciar con PM2
Write-Host "▶️  Iniciando aplicación con PM2..." -ForegroundColor Cyan
pm2 start ecosystem.config.js

# Guardar configuración de PM2
Write-Host "💾 Guardando configuración de PM2..." -ForegroundColor Cyan
pm2 save

# Configurar inicio automático
Write-Host "⚙️  Configurando inicio automático..." -ForegroundColor Cyan
Write-Host "Ejecuta el siguiente comando que PM2 te mostrará:" -ForegroundColor Yellow
pm2 startup

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - Ver estado: npm run pm2:status"
Write-Host "  - Ver logs: npm run pm2:logs"
Write-Host "  - Reiniciar: npm run pm2:restart"
Write-Host "  - Detener: npm run pm2:stop"
Write-Host ""

