#!/bin/bash
# Script de instalación para BITCAN - Plataforma Educativa
# Bash Script para Linux/macOS

echo "=================================="
echo "  BITCAN - Instalación Automática"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${YELLOW}1. Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "   ${GREEN}✓ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "   ${RED}✗ Node.js no encontrado. Por favor instala Node.js 18+ desde https://nodejs.org${NC}"
    exit 1
fi

# Verificar npm
echo -e "${YELLOW}2. Verificando npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "   ${GREEN}✓ npm instalado: $NPM_VERSION${NC}"
else
    echo -e "   ${RED}✗ npm no encontrado${NC}"
    exit 1
fi

# Instalar dependencias
echo ""
echo -e "${YELLOW}3. Instalando dependencias...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓ Dependencias instaladas correctamente${NC}"
else
    echo -e "   ${RED}✗ Error al instalar dependencias${NC}"
    exit 1
fi

# Verificar archivo .env.local
echo ""
echo -e "${YELLOW}4. Verificando configuración...${NC}"
if [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✓ Archivo .env.local encontrado${NC}"
else
    echo -e "   ${YELLOW}! Creando .env.local desde .env.example${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "   ${GREEN}✓ Archivo .env.local creado${NC}"
        echo -e "   ${CYAN}! IMPORTANTE: Edita .env.local con tus credenciales${NC}"
    else
        echo -e "   ${RED}✗ No se encontró .env.example${NC}"
    fi
fi

# Resumen final
echo ""
echo "=================================="
echo "  Instalación Completada"
echo "=================================="
echo ""
echo -e "Para iniciar el servidor de desarrollo:"
echo -e "  ${GREEN}npm run dev${NC}"
echo ""
echo -e "La aplicación estará en:"
echo -e "  ${CYAN}http://localhost:3000${NC}"
echo ""
echo -e "Documentación completa en:"
echo -e "  ${CYAN}README.md${NC}"
echo -e "  ${CYAN}INICIO-RAPIDO.md${NC}"
echo ""



