#!/usr/bin/env node

/**
 * Script de prueba de conexión a MySQL en VPS
 * Ejecutar: node test-db.js
 */

const mysql = require('mysql2/promise');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function testConnection() {
  console.log(`${colors.cyan}=================================`);
  console.log('🔍 Probando conexión a VPS MySQL');
  console.log(`==================================${colors.reset}\n`);

  const config = {
    host: '64.176.18.16',
    port: 3306,
    user: 'bitcanc_s1mple',
    password: '.Recalde97123',
    database: 'bitcanc_usuarios',
    connectTimeout: 10000,
  };

  console.log(`📡 Host: ${config.host}`);
  console.log(`🔌 Puerto: ${config.port}`);
  console.log(`👤 Usuario: ${config.user}`);
  console.log(`💾 Base de datos: ${config.database}\n`);

  let connection;

  try {
    console.log(`${colors.yellow}⏳ Conectando...${colors.reset}`);
    
    connection = await mysql.createConnection(config);
    
    console.log(`${colors.green}✅ ¡Conexión exitosa!${colors.reset}\n`);

    // Probar queries básicas
    console.log(`${colors.cyan}📊 Obteniendo estadísticas:${colors.reset}`);
    
    // Total de usuarios
    const [users] = await connection.execute('SELECT COUNT(*) as total FROM users');
    console.log(`   👥 Total de usuarios: ${colors.green}${users[0].total}${colors.reset}`);

    // Total de cursos
    const [courses] = await connection.execute('SELECT COUNT(*) as total FROM courses');
    console.log(`   📚 Total de cursos: ${colors.green}${courses[0].total}${colors.reset}`);

    // Usuarios por rol
    const [roles] = await connection.execute(
      'SELECT role, COUNT(*) as total FROM users GROUP BY role'
    );
    console.log(`\n   ${colors.cyan}Usuarios por rol:${colors.reset}`);
    roles.forEach(r => {
      console.log(`      • ${r.role}: ${colors.green}${r.total}${colors.reset}`);
    });

    // Info del servidor
    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log(`\n   ${colors.cyan}MySQL Version:${colors.reset} ${version[0].version}`);

    console.log(`\n${colors.green}=================================`);
    console.log('✅ Todas las pruebas pasaron');
    console.log(`==================================${colors.reset}\n`);

  } catch (error) {
    console.log(`\n${colors.red}❌ Error de conexión:${colors.reset}`);
    console.log(`   ${error.message}\n`);

    if (error.code === 'ETIMEDOUT') {
      console.log(`${colors.yellow}💡 Posibles causas:${colors.reset}`);
      console.log('   • Firewall bloqueando puerto 3306');
      console.log('   • IP del VPS incorrecta');
      console.log('   • MySQL no está corriendo\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log(`${colors.yellow}💡 Posibles causas:${colors.reset}`);
      console.log('   • Usuario o contraseña incorrectos');
      console.log('   • Usuario no tiene permisos remotos\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`${colors.yellow}💡 Posibles causas:${colors.reset}`);
      console.log('   • La base de datos no existe\n');
    }

    console.log(`${colors.cyan}Ver CONEXION-VPS.md para más ayuda${colors.reset}\n`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();






