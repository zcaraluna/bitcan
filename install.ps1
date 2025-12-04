# Script de instalación para BITCAN - Plataforma Educativa
# PowerShell Script para Windows

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  BITCAN - Instalación Automática" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js no encontrado. Por favor instala Node.js 18+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "2. Verificando npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ npm instalado: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ npm no encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host ""
Write-Host "3. Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

# Verificar archivo .env.local
Write-Host ""
Write-Host "4. Verificando configuración..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✓ Archivo .env.local encontrado" -ForegroundColor Green
} else {
    Write-Host "   ! Creando .env.local desde .env.example" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "   ✓ Archivo .env.local creado" -ForegroundColor Green
        Write-Host "   ! IMPORTANTE: Edita .env.local con tus credenciales" -ForegroundColor Cyan
    } else {
        Write-Host "   ✗ No se encontró .env.example" -ForegroundColor Red
    }
}

# Resumen final
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Instalación Completada" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el servidor de desarrollo:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "La aplicación estará en:" -ForegroundColor White
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentación completa en:" -ForegroundColor White
Write-Host "  README.md" -ForegroundColor Cyan
Write-Host "  INICIO-RAPIDO.md" -ForegroundColor Cyan
Write-Host ""



