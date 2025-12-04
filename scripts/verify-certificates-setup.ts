/**
 * Script de verificación de instalación del sistema de certificados V2
 * Ejecutar con: npx tsx scripts/verify-certificates-setup.ts
 */

import { getPDFGenerator } from '../src/lib/certificates/pdf-generator';
import { getTemplateEngine } from '../src/lib/certificates/template-engine';
import { getCertificateService } from '../src/lib/certificates/certificate-service';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
  };
  
  const icon = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warning: '⚠',
  };
  
  console.log(`${colorMap[type]}${icon[type]} ${message}${colors.reset}`);
}

async function verifyPuppeteer() {
  log('Verificando Puppeteer...', 'info');
  try {
    const pdfGenerator = getPDFGenerator();
    const testHtml = '<html><body><h1>Test</h1></body></html>';
    const pdf = await pdfGenerator.generatePDF(testHtml);
    
    if (pdf.length > 0) {
      log(`Puppeteer funcionando correctamente (PDF: ${pdf.length} bytes)`, 'success');
      return true;
    } else {
      log('Puppeteer generó PDF vacío', 'error');
      return false;
    }
  } catch (error) {
    log(`Error en Puppeteer: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    return false;
  }
}

async function verifyTemplateEngine() {
  log('Verificando motor de plantillas...', 'info');
  try {
    const engine = getTemplateEngine();
    const template = '<div>Hola {{name}}</div>';
    const rendered = engine.render(template, { name: 'Mundo' } as any);
    
    if (rendered.includes('Hola Mundo')) {
      log('Motor de plantillas funcionando correctamente', 'success');
      return true;
    } else {
      log('Motor de plantillas no renderiza correctamente', 'error');
      return false;
    }
  } catch (error) {
    log(`Error en motor de plantillas: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    return false;
  }
}

async function verifyHelpers() {
  log('Verificando helpers de Handlebars...', 'info');
  try {
    const engine = getTemplateEngine();
    
    const tests = [
      { template: '{{formatDate "2025-01-15"}}', expected: 'fecha formateada' },
      { template: '{{formatNumber 1000}}', expected: '1.000' },
      { template: '{{uppercase "test"}}', expected: 'TEST' },
      { template: '{{lowercase "TEST"}}', expected: 'test' },
    ];
    
    let allPassed = true;
    for (const test of tests) {
      try {
        const rendered = engine.render(test.template, {} as any);
        log(`  Helper test: ${test.template.substring(0, 30)}... ✓`, 'success');
      } catch (error) {
        log(`  Helper test: ${test.template.substring(0, 30)}... ✗`, 'error');
        allPassed = false;
      }
    }
    
    return allPassed;
  } catch (error) {
    log(`Error verificando helpers: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    return false;
  }
}

async function verifyDatabase() {
  log('Verificando conexión a base de datos...', 'info');
  try {
    const { query } = await import('../src/lib/db');
    
    // Verificar tabla certificates
    const certTable = await query('SHOW TABLES LIKE "certificates"');
    if (certTable.length === 0) {
      log('Tabla certificates no existe', 'error');
      return false;
    }
    log('Tabla certificates existe', 'success');
    
    // Verificar tabla certificate_templates
    const templatesTable = await query('SHOW TABLES LIKE "certificate_templates"');
    if (templatesTable.length === 0) {
      log('Tabla certificate_templates no existe', 'error');
      return false;
    }
    log('Tabla certificate_templates existe', 'success');
    
    // Verificar tabla certificate_logs
    const logsTable = await query('SHOW TABLES LIKE "certificate_logs"');
    if (logsTable.length === 0) {
      log('Tabla certificate_logs no existe (opcional)', 'warning');
    } else {
      log('Tabla certificate_logs existe', 'success');
    }
    
    // Verificar columnas de certificates
    const columns = await query('DESCRIBE certificates');
    const requiredColumns = ['metadata', 'revoked_by', 'revoked_at', 'revoke_reason'];
    
    for (const col of requiredColumns) {
      const exists = columns.some((c: any) => c.Field === col);
      if (!exists) {
        log(`Columna ${col} no existe en certificates`, 'error');
        return false;
      }
    }
    log('Todas las columnas requeridas existen', 'success');
    
    return true;
  } catch (error) {
    log(`Error verificando base de datos: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    return false;
  }
}

async function verifyEnvironment() {
  log('Verificando variables de entorno...', 'info');
  
  const requiredVars = ['NEXT_PUBLIC_APP_URL'];
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`${varName} está configurado`, 'success');
    } else {
      log(`${varName} no está configurado`, 'warning');
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function verifyFiles() {
  log('Verificando archivos del sistema...', 'info');
  const fs = await import('fs/promises');
  
  const requiredFiles = [
    'src/types/certificates.ts',
    'src/lib/certificates/pdf-generator.ts',
    'src/lib/certificates/template-engine.ts',
    'src/lib/certificates/certificate-service.ts',
    'src/app/api/v2/certificates/route.ts',
    'src/components/certificates/CertificateListV2.tsx',
    'database/migrations/certificates_v2_migration.sql',
    'docs/CERTIFICATES_V2.md',
  ];
  
  let allExist = true;
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      log(`${file} existe`, 'success');
    } catch {
      log(`${file} no existe`, 'error');
      allExist = false;
    }
  }
  
  return allExist;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  VERIFICACIÓN DE INSTALACIÓN - CERTIFICADOS V2');
  console.log('='.repeat(60) + '\n');
  
  const results = {
    files: await verifyFiles(),
    environment: await verifyEnvironment(),
    database: await verifyDatabase(),
    templateEngine: await verifyTemplateEngine(),
    helpers: await verifyHelpers(),
    puppeteer: await verifyPuppeteer(),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('  RESUMEN');
  console.log('='.repeat(60) + '\n');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result ? '✓' : '✗';
    const color = result ? colors.green : colors.red;
    console.log(`${color}${status}${colors.reset} ${name}`);
  });
  
  console.log(`\n${colors.blue}Resultado: ${passed}/${total} verificaciones pasadas${colors.reset}\n`);
  
  if (passed === total) {
    log('¡Sistema de certificados V2 instalado correctamente!', 'success');
    console.log('\nPróximos pasos:');
    console.log('1. Ejecutar: npm run dev');
    console.log('2. Visitar: http://localhost:3000/v2/certificates');
    console.log('3. Generar tu primer certificado\n');
  } else {
    log('Hay problemas con la instalación. Revisa los errores arriba.', 'error');
    console.log('\nConsulta la documentación en:');
    console.log('- docs/CERTIFICATES_V2.md');
    console.log('- docs/CERTIFICATES_MIGRATION_GUIDE.md\n');
    process.exit(1);
  }
}

main().catch(console.error);








