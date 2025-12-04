const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

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

async function createTestUser() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos');

    const email = process.argv[2] || 'estudiante3@test.com';
    const password = process.argv[3] || 'test123'; // Contraseña de prueba
    const name = process.argv[4] || 'Estudiante 3';
    const role = 'estudiante';

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log(`⚠️ El usuario ${email} ya existe (ID: ${existingUsers[0].id})`);
      console.log('🗑️ Eliminando usuario existente...');
      // Eliminar usuario existente
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [existingUsers[0].id]
      );
      console.log('✅ Usuario eliminado');
    }

    // Hashear contraseña
    console.log('🔐 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Contraseña hasheada');

    // Crear usuario
    console.log('👤 Creando usuario...');
    const [result] = await connection.execute(
      `INSERT INTO users (
        name, email, password, role, provider, 
        email_verified, profile_completed, is_active, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'email', 1, 0, 1, NOW(), NOW())`,
      [name, email, hashedPassword, role]
    );

    const userId = result.insertId;
    console.log(`✅ Usuario creado exitosamente!`);
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Rol: ${role}`);
    console.log(`   Email verificado: Sí`);
    console.log(`   Perfil completado: No (será redirigido a /completar-perfil)`);
    console.log(`\n📝 Credenciales de acceso:`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);

  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('⚠️ El email ya está en uso');
    }
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 Conexión cerrada');
    }
    await pool.end();
  }
}

createTestUser();

