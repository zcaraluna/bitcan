const mysql = require('mysql2/promise');
const fs = require('fs');

// Cargar .env.production si existe, sino .env.local
const envFile = fs.existsSync('.env.production') ? '.env.production' : '.env.local';
require('dotenv').config({ path: envFile });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'bitcanc_s1mple',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bitcanc_usuarios',
};

const migrations = [
  {
    name: 'add_profile_fields',
    checks: [
      { table: 'users', column: 'nombres' },
      { table: 'users', column: 'apellidos' },
      { table: 'users', column: 'profile_completed' },
    ],
  },
  {
    name: 'add_crypto_payment_fields',
    checks: [
      { table: 'courses', column: 'payment_crypto_wallet' },
      { table: 'courses', column: 'payment_crypto_network' },
    ],
  },
  {
    name: 'certificates_v2_migration',
    checks: [
      { table: 'certificates', column: 'metadata' },
      { table: 'certificates', column: 'revoked_by' },
      { table: 'certificate_templates', exists: true },
    ],
  },
];

async function checkColumnExists(connection, table, column) {
  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
      [dbConfig.database, table, column]
    );
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function checkTableExists(connection, table) {
  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = ?`,
      [dbConfig.database, table]
    );
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function checkMigrations() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    console.log('🔍 Verificando estado de migraciones...\n');

    for (const migration of migrations) {
      console.log(`📋 ${migration.name}:`);
      
      let allApplied = true;
      
      for (const check of migration.checks) {
        let exists = false;
        
        if (check.exists !== undefined) {
          exists = await checkTableExists(connection, check.table);
        } else {
          exists = await checkColumnExists(connection, check.table, check.column);
        }
        
        const status = exists ? '✅' : '❌';
        const item = check.column || check.table;
        console.log(`   ${status} ${check.table}.${item}`);
        
        if (!exists) allApplied = false;
      }
      
      const migrationStatus = allApplied ? '✅ APLICADA' : '⏳ PENDIENTE';
      console.log(`   Estado: ${migrationStatus}\n`);
    }

    // Verificar tabla de migraciones
    const migrationsTableExists = await checkTableExists(connection, 'schema_migrations');
    if (migrationsTableExists) {
      const [rows] = await connection.execute(
        'SELECT migration_name, applied_at FROM schema_migrations ORDER BY applied_at'
      );
      console.log('📊 Migraciones registradas:');
      if (rows.length > 0) {
        rows.forEach(row => {
          console.log(`   ✅ ${row.migration_name} (${row.applied_at})`);
        });
      } else {
        console.log('   (Ninguna migración registrada aún)');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMigrations();

