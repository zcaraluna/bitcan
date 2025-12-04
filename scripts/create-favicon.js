const fs = require('fs');
const path = require('path');

// Leer el PNG
const pngPath = path.join(__dirname, '../public/bitcan-logo.png');
const icoPath = path.join(__dirname, '../public/favicon.ico');

try {
  // Copiar el PNG como ICO (los navegadores modernos aceptan PNG como favicon)
  if (fs.existsSync(pngPath)) {
    fs.copyFileSync(pngPath, icoPath);
    console.log('✅ Favicon creado exitosamente en public/favicon.ico');
  } else {
    console.error('❌ No se encontró bitcan-logo.png en public/');
  }
} catch (error) {
  console.error('❌ Error al crear favicon:', error.message);
}

