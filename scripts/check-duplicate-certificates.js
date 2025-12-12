/**
 * Script para verificar si hay casos donde se generaron
 * tanto certificados de módulo como de curso para el mismo estudiante
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkDuplicateCertificates() {
  let connection;

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('🔍 Verificando certificados duplicados...\n');

    // Buscar casos donde un estudiante tiene tanto certificado de módulo como de curso
    const [duplicates] = await connection.execute(`
      SELECT 
        c1.user_id,
        c1.course_id,
        u.name as student_name,
        co.title as course_title,
        COUNT(CASE WHEN c1.certificate_type = 'module_completion' THEN 1 END) as module_certs,
        COUNT(CASE WHEN c1.certificate_type = 'course_completion' THEN 1 END) as course_certs,
        COUNT(CASE WHEN c1.certificate_type IS NULL OR c1.certificate_type = 'course' THEN 1 END) as legacy_certs,
        GROUP_CONCAT(DISTINCT c1.certificate_type ORDER BY c1.certificate_type) as certificate_types,
        GROUP_CONCAT(c1.certificate_number ORDER BY c1.created_at SEPARATOR ', ') as certificate_numbers,
        MIN(c1.created_at) as first_certificate,
        MAX(c1.created_at) as last_certificate
      FROM certificates c1
      JOIN users u ON c1.user_id = u.id
      JOIN courses co ON c1.course_id = co.id
      WHERE c1.user_id IN (
        SELECT DISTINCT user_id 
        FROM certificates 
        WHERE course_id = c1.course_id
        GROUP BY user_id, course_id
        HAVING COUNT(DISTINCT certificate_type) > 1
      )
      GROUP BY c1.user_id, c1.course_id
      HAVING module_certs > 0 AND (course_certs > 0 OR legacy_certs > 0)
      ORDER BY c1.user_id, c1.course_id
    `);

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron casos donde un estudiante tenga tanto certificado de módulo como de curso.\n');
    } else {
      console.log(`⚠️  Se encontraron ${duplicates.length} casos donde un estudiante tiene ambos tipos de certificados:\n`);
      
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. Estudiante: ${dup.student_name} (ID: ${dup.user_id})`);
        console.log(`   Curso: ${dup.course_title} (ID: ${dup.course_id})`);
        console.log(`   Certificados de módulo: ${dup.module_certs}`);
        console.log(`   Certificados de curso: ${dup.course_certs}`);
        console.log(`   Certificados legacy: ${dup.legacy_certs}`);
        console.log(`   Tipos encontrados: ${dup.certificate_types}`);
        console.log(`   Números de certificado: ${dup.certificate_numbers}`);
        console.log(`   Primer certificado: ${dup.first_certificate}`);
        console.log(`   Último certificado: ${dup.last_certificate}`);
        console.log('');
      });
    }

    // Verificar también casos donde se generaron múltiples certificados del mismo tipo
    const [multipleSameType] = await connection.execute(`
      SELECT 
        user_id,
        course_id,
        certificate_type,
        COUNT(*) as count,
        GROUP_CONCAT(certificate_number ORDER BY created_at SEPARATOR ', ') as certificate_numbers
      FROM certificates
      WHERE certificate_type IN ('module_completion', 'course_completion')
      GROUP BY user_id, course_id, certificate_type
      HAVING count > 1
      ORDER BY user_id, course_id, certificate_type
    `);

    if (multipleSameType.length > 0) {
      console.log(`⚠️  Se encontraron ${multipleSameType.length} casos con múltiples certificados del mismo tipo:\n`);
      
      multipleSameType.forEach((multi, index) => {
        console.log(`${index + 1}. Usuario: ${multi.user_id}, Curso: ${multi.course_id}, Tipo: ${multi.certificate_type}`);
        console.log(`   Cantidad: ${multi.count}`);
        console.log(`   Números: ${multi.certificate_numbers}`);
        console.log('');
      });
    } else {
      console.log('✅ No se encontraron casos con múltiples certificados del mismo tipo.\n');
    }

    // Estadísticas generales
    const [stats] = await connection.execute(`
      SELECT 
        certificate_type,
        COUNT(*) as total,
        COUNT(DISTINCT user_id) as unique_students,
        COUNT(DISTINCT course_id) as unique_courses
      FROM certificates
      WHERE certificate_type IN ('module_completion', 'course_completion') 
         OR certificate_type IS NULL 
         OR certificate_type = 'course'
      GROUP BY certificate_type
      ORDER BY certificate_type
    `);

    console.log('📊 Estadísticas de certificados:\n');
    stats.forEach((stat) => {
      console.log(`   Tipo: ${stat.certificate_type || 'NULL/legacy'}`);
      console.log(`   Total: ${stat.total}`);
      console.log(`   Estudiantes únicos: ${stat.unique_students}`);
      console.log(`   Cursos únicos: ${stat.unique_courses}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDuplicateCertificates();

