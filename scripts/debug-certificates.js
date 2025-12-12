require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function debugCertificates() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('🔌 Conexión a la base de datos exitosa.\n');

    // Obtener los últimos 10 certificados generados
    const [recentCerts] = await connection.execute(`
      SELECT 
        c.id,
        c.user_id,
        c.course_id,
        c.certificate_type,
        c.certificate_number,
        c.status,
        c.created_at,
        u.name as student_name,
        co.title as course_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    console.log('📋 Últimos 10 certificados generados:');
    console.log('═══════════════════════════════════════════════════════════');
    recentCerts.forEach((cert, index) => {
      console.log(`\n${index + 1}. Certificado #${cert.certificate_number}`);
      console.log(`   Estudiante: ${cert.student_name} (ID: ${cert.user_id})`);
      console.log(`   Curso: ${cert.course_title} (ID: ${cert.course_id})`);
      console.log(`   Tipo: ${cert.certificate_type || 'NULL'} ${cert.certificate_type === 'module_completion' ? '✅ MÓDULO' : cert.certificate_type === 'course_completion' ? '✅ CURSO' : '⚠️  TIPO ANTIGUO/NULL'}`);
      console.log(`   Estado: ${cert.status}`);
      console.log(`   Creado: ${cert.created_at}`);
    });

    // Contar por tipo
    const [counts] = await connection.execute(`
      SELECT 
        certificate_type,
        COUNT(*) as total
      FROM certificates
      GROUP BY certificate_type
      ORDER BY total DESC
    `);

    console.log('\n\n📊 Estadísticas por tipo:');
    console.log('═══════════════════════════════════════════════════════════');
    counts.forEach((row) => {
      console.log(`   ${row.certificate_type || 'NULL'}: ${row.total} certificados`);
    });

    // Buscar certificados de módulo recientes
    const [moduleCerts] = await connection.execute(`
      SELECT 
        c.id,
        c.user_id,
        c.course_id,
        c.certificate_type,
        c.certificate_number,
        c.created_at,
        u.name as student_name,
        co.title as course_title,
        JSON_EXTRACT(c.certificate_data, '$.module_name') as module_name
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.certificate_type = 'module_completion'
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    console.log('\n\n🎯 Últimos 5 certificados de MÓDULO:');
    console.log('═══════════════════════════════════════════════════════════');
    if (moduleCerts.length === 0) {
      console.log('   ⚠️  No se encontraron certificados de módulo');
    } else {
      moduleCerts.forEach((cert, index) => {
        console.log(`\n${index + 1}. Certificado #${cert.certificate_number}`);
        console.log(`   Estudiante: ${cert.student_name} (ID: ${cert.user_id})`);
        console.log(`   Curso: ${cert.course_title} (ID: ${cert.course_id})`);
        console.log(`   Módulo: ${cert.module_name || 'N/A'}`);
        console.log(`   Creado: ${cert.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada.');
    }
  }
}

debugCertificates();



