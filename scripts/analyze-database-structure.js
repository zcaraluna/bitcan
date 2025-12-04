const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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

async function analyzeDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    const database = dbConfig.database;
    const output = {
      database: database,
      analyzed_at: new Date().toISOString(),
      tables: {},
      views: [],
      procedures: [],
      triggers: [],
    };

    // Obtener lista de tablas
    console.log('📋 Obteniendo lista de tablas...');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [database]
    );

    console.log(`✅ Encontradas ${tables.length} tablas\n`);

    // Analizar cada tabla
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`🔍 Analizando tabla: ${tableName}...`);

      // Obtener columnas
      const [columns] = await connection.execute(
        `SELECT 
          COLUMN_NAME,
          ORDINAL_POSITION,
          COLUMN_DEFAULT,
          IS_NULLABLE,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE,
          COLUMN_TYPE,
          COLUMN_KEY,
          EXTRA,
          COLUMN_COMMENT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
        [database, tableName]
      );

      // Obtener índices
      const [indexes] = await connection.execute(
        `SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          SEQ_IN_INDEX,
          NON_UNIQUE,
          INDEX_TYPE,
          INDEX_COMMENT
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [database, tableName]
      );

      // Obtener foreign keys
      const [foreignKeysRaw] = await connection.execute(
        `SELECT 
          kcu.CONSTRAINT_NAME,
          kcu.COLUMN_NAME,
          kcu.REFERENCED_TABLE_NAME,
          kcu.REFERENCED_COLUMN_NAME,
          rc.UPDATE_RULE,
          rc.DELETE_RULE
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
          ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
          AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
        WHERE kcu.TABLE_SCHEMA = ? 
        AND kcu.TABLE_NAME = ?
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`,
        [database, tableName]
      );
      const foreignKeys = foreignKeysRaw;

      // Obtener triggers
      const [triggers] = await connection.execute(
        `SELECT 
          TRIGGER_NAME,
          EVENT_MANIPULATION,
          EVENT_OBJECT_TABLE,
          ACTION_TIMING,
          ACTION_STATEMENT
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = ? AND EVENT_OBJECT_TABLE = ?`,
        [database, tableName]
      );

      // Contar filas
      const [rowCount] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      const count = rowCount[0].count;

      output.tables[tableName] = {
        columns: columns.map(col => ({
          name: col.COLUMN_NAME,
          position: col.ORDINAL_POSITION,
          type: col.COLUMN_TYPE,
          dataType: col.DATA_TYPE,
          maxLength: col.CHARACTER_MAXIMUM_LENGTH,
          precision: col.NUMERIC_PRECISION,
          scale: col.NUMERIC_SCALE,
          nullable: col.IS_NULLABLE === 'YES',
          default: col.COLUMN_DEFAULT,
          key: col.COLUMN_KEY,
          extra: col.EXTRA,
          comment: col.COLUMN_COMMENT,
        })),
        indexes: indexes.reduce((acc, idx) => {
          if (!acc[idx.INDEX_NAME]) {
            acc[idx.INDEX_NAME] = {
              name: idx.INDEX_NAME,
              unique: idx.NON_UNIQUE === 0,
              type: idx.INDEX_TYPE,
              columns: [],
              comment: idx.INDEX_COMMENT,
            };
          }
          acc[idx.INDEX_NAME].columns.push({
            name: idx.COLUMN_NAME,
            position: idx.SEQ_IN_INDEX,
          });
          return acc;
        }, {}),
        foreignKeys: foreignKeys.map(fk => ({
          name: fk.CONSTRAINT_NAME,
          column: fk.COLUMN_NAME,
          referencedTable: fk.REFERENCED_TABLE_NAME,
          referencedColumn: fk.REFERENCED_COLUMN_NAME,
          updateRule: fk.UPDATE_RULE,
          deleteRule: fk.DELETE_RULE,
        })),
        triggers: triggers.map(trg => ({
          name: trg.TRIGGER_NAME,
          event: trg.EVENT_MANIPULATION,
          timing: trg.ACTION_TIMING,
          statement: trg.ACTION_STATEMENT,
        })),
        rowCount: count,
      };

      console.log(`   ✅ ${columns.length} columnas, ${Object.keys(output.tables[tableName].indexes).length} índices, ${foreignKeys.length} foreign keys, ${triggers.length} triggers, ${count} filas`);
    }

    // Obtener vistas
    console.log('\n📋 Obteniendo vistas...');
    const [views] = await connection.execute(
      `SELECT TABLE_NAME, VIEW_DEFINITION
       FROM INFORMATION_SCHEMA.VIEWS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [database]
    );
    output.views = views.map(v => ({
      name: v.TABLE_NAME,
      definition: v.VIEW_DEFINITION,
    }));
    console.log(`✅ Encontradas ${views.length} vistas`);

    // Obtener procedimientos almacenados
    console.log('\n📋 Obteniendo procedimientos almacenados...');
    const [procedures] = await connection.execute(
      `SELECT ROUTINE_NAME, ROUTINE_TYPE, ROUTINE_DEFINITION
       FROM INFORMATION_SCHEMA.ROUTINES
       WHERE ROUTINE_SCHEMA = ?
       ORDER BY ROUTINE_NAME`,
      [database]
    );
    output.procedures = procedures.map(p => ({
      name: p.ROUTINE_NAME,
      type: p.ROUTINE_TYPE,
      definition: p.ROUTINE_DEFINITION,
    }));
    console.log(`✅ Encontrados ${procedures.length} procedimientos`);

    // Guardar resultado
    const outputPath = path.join(__dirname, '..', 'database-structure-local.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    
    console.log(`\n✅ Estructura guardada en: ${outputPath}`);
    console.log(`\n📊 Resumen:`);
    console.log(`   - Tablas: ${Object.keys(output.tables).length}`);
    console.log(`   - Vistas: ${output.views.length}`);
    console.log(`   - Procedimientos: ${output.procedures.length}`);
    console.log(`   - Total de filas: ${Object.values(output.tables).reduce((sum, t) => sum + t.rowCount, 0)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

analyzeDatabase();

