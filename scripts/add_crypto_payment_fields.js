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

async function addCryptoFields() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos');

    // Verificar si las columnas ya existen
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'courses' 
        AND COLUMN_NAME IN ('payment_crypto_wallet', 'payment_crypto_network', 'payment_crypto_currency')
    `, [process.env.DB_NAME || 'bitcanc_usuarios']);

    const existingColumns = columns.map((col) => col.COLUMN_NAME);

    // Agregar campos que no existen
    if (!existingColumns.includes('payment_crypto_wallet')) {
      await connection.execute(`
        ALTER TABLE courses
        ADD COLUMN payment_crypto_wallet VARCHAR(255) NULL COMMENT 'Dirección de billetera cripto'
      `);
      console.log('✅ Campo payment_crypto_wallet agregado');
    } else {
      console.log('⏭️  Campo payment_crypto_wallet ya existe');
    }

    if (!existingColumns.includes('payment_crypto_network')) {
      await connection.execute(`
        ALTER TABLE courses
        ADD COLUMN payment_crypto_network VARCHAR(50) NULL COMMENT 'Red de la criptomoneda (TRC20, ERC20, BEP20, etc.)'
      `);
      console.log('✅ Campo payment_crypto_network agregado');
    } else {
      console.log('⏭️  Campo payment_crypto_network ya existe');
    }

    if (!existingColumns.includes('payment_crypto_currency')) {
      await connection.execute(`
        ALTER TABLE courses
        ADD COLUMN payment_crypto_currency VARCHAR(20) NULL COMMENT 'Tipo de criptomoneda (USDT, BTC, ETH, etc.)'
      `);
      console.log('✅ Campo payment_crypto_currency agregado');
    } else {
      console.log('⏭️  Campo payment_crypto_currency ya existe');
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

addCryptoFields();

