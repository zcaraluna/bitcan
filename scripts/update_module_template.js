/**
 * Script para actualizar la plantilla de módulo y agregar soporte para CUSTOM_MESSAGE
 * Ejecutar con: node scripts/update_module_template.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnv();

async function updateModuleTemplate() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'bitcanc_usuarios',
      user: process.env.DB_USER || 'bitcanc_s1mple',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Conectado a la base de datos');

    // Buscar plantillas de módulo
    const [templates] = await connection.execute(`
      SELECT id, name, template_html 
      FROM certificate_templates
      WHERE template_html LIKE '%MODULE_NAME%' 
         OR template_html LIKE '%por haber completado exitosamente el módulo%'
    `);

    if (templates.length === 0) {
      console.log('⚠️  No se encontraron plantillas de módulo');
      return;
    }

    console.log(`📋 Encontradas ${templates.length} plantilla(s) de módulo`);

    // Actualizar cada plantilla
    for (const template of templates) {
      let updatedHtml = template.template_html;
      
      // Verificar si ya tiene el mensaje personalizado
      if (updatedHtml.includes('{{#if CUSTOM_MESSAGE}}')) {
        console.log(`⏭️  La plantilla "${template.name}" (ID: ${template.id}) ya tiene CUSTOM_MESSAGE`);
        continue;
      }

      // Reemplazar el footer para incluir CUSTOM_MESSAGE
      updatedHtml = updatedHtml.replace(
        /<div class="instructor-notice">\{\{CUSTOM_SIGNATURE\}\}<\/div>/g,
        '<div class="instructor-notice">{{CUSTOM_SIGNATURE}}{{#if CUSTOM_MESSAGE}}<div style="margin-top: 15px; font-size: 0.95rem; font-weight: 400; line-height: 1.5;">{{CUSTOM_MESSAGE}}</div>{{/if}}</div>'
      );

      // Si no se encontró el patrón exacto, intentar con variaciones
      if (updatedHtml === template.template_html) {
        // Intentar con espacios o saltos de línea
        updatedHtml = updatedHtml.replace(
          /<div class="instructor-notice">\s*\{\{CUSTOM_SIGNATURE\}\}\s*<\/div>/g,
          '<div class="instructor-notice">{{CUSTOM_SIGNATURE}}{{#if CUSTOM_MESSAGE}}<div style="margin-top: 15px; font-size: 0.95rem; font-weight: 400; line-height: 1.5;">{{CUSTOM_MESSAGE}}</div>{{/if}}</div>'
        );
      }

      if (updatedHtml !== template.template_html) {
        await connection.execute(
          `UPDATE certificate_templates 
           SET template_html = ?, updated_at = NOW() 
           WHERE id = ?`,
          [updatedHtml, template.id]
        );
        console.log(`✅ Plantilla "${template.name}" (ID: ${template.id}) actualizada exitosamente`);
      } else {
        console.log(`⚠️  No se pudo actualizar la plantilla "${template.name}" (ID: ${template.id}) - patrón no encontrado`);
        console.log('   Buscando manualmente el footer...');
        
        // Mostrar el footer actual para debugging
        const footerMatch = template.template_html.match(/<div class="certificate-footer">[\s\S]*?<\/div>/);
        if (footerMatch) {
          console.log('   Footer encontrado:', footerMatch[0].substring(0, 200));
        }
      }
    }

    console.log('\n✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
updateModuleTemplate();

