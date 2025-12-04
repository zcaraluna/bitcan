const fs = require('fs');
const path = require('path');

// Cargar estructuras
const localPath = path.join(__dirname, '..', 'database-structure-local.json');
const vpsPath = path.join(__dirname, '..', 'database-structure-vps.json');

if (!fs.existsSync(localPath)) {
  console.error('❌ No se encontró database-structure-local.json');
  console.error('   Ejecuta primero: node scripts/analyze-database-structure.js');
  process.exit(1);
}

if (!fs.existsSync(vpsPath)) {
  console.error('❌ No se encontró database-structure-vps.json');
  console.error('   Ejecuta en el VPS: node scripts/analyze-database-structure.js');
  console.error('   Luego copia el archivo database-structure-vps.json al proyecto local');
  process.exit(1);
}

const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
const vps = JSON.parse(fs.readFileSync(vpsPath, 'utf8'));

console.log('🔍 Comparando estructuras de base de datos...\n');
console.log(`Local: ${local.database} (${local.analyzed_at})`);
console.log(`VPS: ${vps.database} (${vps.analyzed_at})\n`);

const differences = {
  missingTables: [],
  extraTables: [],
  tableDifferences: {},
};

// Comparar tablas
const localTables = new Set(Object.keys(local.tables));
const vpsTables = new Set(Object.keys(vps.tables));

// Tablas que faltan en VPS
localTables.forEach(table => {
  if (!vpsTables.has(table)) {
    differences.missingTables.push(table);
  }
});

// Tablas extra en VPS
vpsTables.forEach(table => {
  if (!localTables.has(table)) {
    differences.extraTables.push(table);
  }
});

// Comparar estructura de tablas comunes
const commonTables = [...localTables].filter(t => vpsTables.has(t));

commonTables.forEach(tableName => {
  const localTable = local.tables[tableName];
  const vpsTable = vps.tables[tableName];
  
  const tableDiff = {
    missingColumns: [],
    extraColumns: [],
    columnDifferences: [],
  };

  // Comparar columnas
  const localColumns = new Map(localTable.columns.map(c => [c.name, c]));
  const vpsColumns = new Map(vpsTable.columns.map(c => [c.name, c]));

  localColumns.forEach((col, name) => {
    if (!vpsColumns.has(name)) {
      tableDiff.missingColumns.push(name);
    } else {
      const vpsCol = vpsColumns.get(name);
      if (col.type !== vpsCol.type || col.nullable !== vpsCol.nullable) {
        tableDiff.columnDifferences.push({
          column: name,
          local: { type: col.type, nullable: col.nullable, default: col.default },
          vps: { type: vpsCol.type, nullable: vpsCol.nullable, default: vpsCol.default },
        });
      }
    }
  });

  vpsColumns.forEach((col, name) => {
    if (!localColumns.has(name)) {
      tableDiff.extraColumns.push(name);
    }
  });

  if (tableDiff.missingColumns.length > 0 || 
      tableDiff.extraColumns.length > 0 || 
      tableDiff.columnDifferences.length > 0) {
    differences.tableDifferences[tableName] = tableDiff;
  }
});

// Mostrar resultados
console.log('📊 RESULTADOS DE LA COMPARACIÓN:\n');

if (differences.missingTables.length > 0) {
  console.log('❌ Tablas que faltan en VPS:');
  differences.missingTables.forEach(t => console.log(`   - ${t}`));
  console.log('');
}

if (differences.extraTables.length > 0) {
  console.log('⚠️  Tablas extra en VPS:');
  differences.extraTables.forEach(t => console.log(`   - ${t}`));
  console.log('');
}

if (Object.keys(differences.tableDifferences).length > 0) {
  console.log('🔍 Diferencias en tablas comunes:\n');
  Object.entries(differences.tableDifferences).forEach(([table, diff]) => {
    if (diff.missingColumns.length > 0 || diff.extraColumns.length > 0 || diff.columnDifferences.length > 0) {
      console.log(`📋 ${table}:`);
      if (diff.missingColumns.length > 0) {
        console.log(`   ❌ Columnas faltantes en VPS: ${diff.missingColumns.join(', ')}`);
      }
      if (diff.extraColumns.length > 0) {
        console.log(`   ⚠️  Columnas extra en VPS: ${diff.extraColumns.join(', ')}`);
      }
      if (diff.columnDifferences.length > 0) {
        console.log(`   🔄 Diferencias en columnas:`);
        diff.columnDifferences.forEach(cd => {
          console.log(`      - ${cd.column}:`);
          console.log(`        Local: ${cd.local.type} (nullable: ${cd.local.nullable})`);
          console.log(`        VPS:   ${cd.vps.type} (nullable: ${cd.vps.nullable})`);
        });
      }
      console.log('');
    }
  });
}

if (differences.missingTables.length === 0 && 
    differences.extraTables.length === 0 && 
    Object.keys(differences.tableDifferences).length === 0) {
  console.log('✅ Las estructuras son idénticas!\n');
}

// Guardar reporte
const reportPath = path.join(__dirname, '..', 'database-comparison-report.json');
fs.writeFileSync(reportPath, JSON.stringify(differences, null, 2), 'utf8');
console.log(`📄 Reporte detallado guardado en: ${reportPath}`);

