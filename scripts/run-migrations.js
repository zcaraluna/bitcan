const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Cargar .env.production si existe, sino .env.local
const envFile = fs.existsSync('.env.production') ? '.env.production' : '.env.local';
require('dotenv').config({ path: envFile });

// Configuración de conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'bitcanc_s1mple',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bitcanc_usuarios',
  multipleStatements: true, // Permitir múltiples statements
};

// Tabla para trackear migraciones
const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_by VARCHAR(255) NULL,
  INDEX idx_migration_name (migration_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// Lista de migraciones en orden
const migrations = [
  {
    name: 'add_profile_fields',
    file: 'add_profile_fields.sql',
    description: 'Agrega campos de perfil a la tabla users',
  },
  {
    name: 'add_crypto_payment_fields',
    file: 'add_crypto_payment_fields.sql',
    description: 'Agrega campos de pago cripto a la tabla courses',
  },
  {
    name: 'add_price_pyg_field',
    file: 'add_price_pyg_field.sql',
    description: 'Agrega campo price_pyg a la tabla courses',
  },
  {
    name: 'certificates_v2_migration',
    file: 'certificates_v2_migration.sql',
    description: 'Migración completa del sistema de certificados V2',
  },
  {
    name: 'update_module_template_custom_message',
    file: 'update_module_template_custom_message.sql',
    description: 'Actualiza plantillas de módulo con mensaje personalizado',
  },
];

async function checkMigrationApplied(connection, migrationName) {
  try {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM schema_migrations WHERE migration_name = ?',
      [migrationName]
    );
    return rows[0].count > 0;
  } catch (error) {
    // Si la tabla no existe, retornar false
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return false;
    }
    throw error;
  }
}

async function markMigrationApplied(connection, migrationName) {
  await connection.execute(
    'INSERT INTO schema_migrations (migration_name, executed_by) VALUES (?, ?)',
    [migrationName, process.env.DB_USER || 'system']
  );
}

async function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'database', 'migrations', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo de migración no encontrado: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

async function runMigrations(dryRun = false) {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    // Crear tabla de migraciones si no existe
    console.log('📋 Creando tabla de seguimiento de migraciones...');
    await connection.execute(MIGRATIONS_TABLE);
    console.log('✅ Tabla de migraciones lista\n');

    // Verificar estado de migraciones
    console.log('🔍 Verificando estado de migraciones...\n');
    
    const results = [];
    for (const migration of migrations) {
      const applied = await checkMigrationApplied(connection, migration.name);
      results.push({ ...migration, applied });
      
      const status = applied ? '✅ APLICADA' : '⏳ PENDIENTE';
      console.log(`${status} - ${migration.name}`);
      console.log(`   ${migration.description}\n`);
    }

    const pendingMigrations = results.filter(m => !m.applied);
    
    if (pendingMigrations.length === 0) {
      console.log('✨ Todas las migraciones ya están aplicadas.\n');
      return;
    }

    if (dryRun) {
      console.log(`\n🔍 MODO DRY-RUN: Se encontraron ${pendingMigrations.length} migraciones pendientes.`);
      console.log('   Ejecuta sin --dry-run para aplicarlas.\n');
      return;
    }

    // Confirmar antes de aplicar
    console.log(`\n⚠️  Se aplicarán ${pendingMigrations.length} migraciones:`);
    pendingMigrations.forEach(m => {
      console.log(`   - ${m.name}`);
    });
    console.log('\n');

    // Aplicar migraciones pendientes
    for (const migration of pendingMigrations) {
      try {
        console.log(`🔄 Aplicando: ${migration.name}...`);
        console.log(`   ${migration.description}`);
        
        const sql = await readMigrationFile(migration.file);
        
        // Ejecutar migración
        await connection.query(sql);
        
        // Marcar como aplicada
        await markMigrationApplied(connection, migration.name);
        
        console.log(`✅ ${migration.name} aplicada exitosamente\n`);
      } catch (error) {
        console.error(`❌ Error aplicando ${migration.name}:`);
        console.error(`   ${error.message}\n`);
        throw error;
      }
    }

    console.log('✨ Todas las migraciones se aplicaron exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error(error.message);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Uso: node scripts/run-migrations.js [opciones]

Opciones:
  --dry-run, -d    Solo verificar estado, no aplicar migraciones
  --help, -h       Mostrar esta ayuda

Ejemplos:
  node scripts/run-migrations.js --dry-run    # Ver estado
  node scripts/run-migrations.js               # Aplicar migraciones
  `);
  process.exit(0);
}

runMigrations(dryRun).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});

