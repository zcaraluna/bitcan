const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Configuración de la conexión a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'bitcanc_usuarios',
  user: process.env.DB_USER || 'bitcanc_s1mple',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function addRucField() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos');

    // Verificar si la columna ya existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'courses' 
        AND COLUMN_NAME = 'payment_ruc'
    `, [process.env.DB_NAME || 'bitcanc_usuarios']);

    if (columns.length === 0) {
      await connection.execute(`
        ALTER TABLE courses
        ADD COLUMN payment_ruc VARCHAR(20) NULL COMMENT 'RUC para pagos'
      `);
      console.log('✅ Campo payment_ruc agregado');
    } else {
      console.log('⏭️  Campo payment_ruc ya existe');
    }

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Conexión cerrada');
    }
    await pool.end();
  }
}

addRucField();

