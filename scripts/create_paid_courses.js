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

// Cursos de pago para crear
const paidCourses = [
  {
    title: 'Curso de Ciberseguridad Avanzada',
    identifier: 'CSEC001',
    slug: 'ciberseguridad-avanzada',
    short_description: 'Aprende técnicas avanzadas de ciberseguridad y protección de sistemas',
    description: 'Este curso cubre temas avanzados de ciberseguridad incluyendo análisis de malware, ingeniería inversa, y técnicas de respuesta a incidentes.',
    category_id: 1, // Ajustar según tu base de datos
    level: 'advanced',
    status: 'activo',
    duration_hours: 40,
    duration_minutes: 0,
    price: 150.00,
    price_pyg: 1125000,
    is_free: 0,
    requires_approval: 1,
    is_published: 1,
    is_featured: 1,
    payment_bank: 'Banco Familiar',
    payment_account: '81-9627954',
    payment_holder: 'GUILLERMO ANDRÉS RECALDE VALDEZ',
    payment_id: '5995260',
    payment_alias: '0982311865',
    payment_whatsapp: '+595 973 408 754',
    exchange_rate_usd: 7500,
    exchange_rate_ars: 7.50,
    exchange_rate_brl: 1450,
  },
  {
    title: 'Fundamentos de Hacking Ético',
    identifier: 'ETH001',
    slug: 'hacking-etico-fundamentos',
    short_description: 'Introducción al hacking ético y pruebas de penetración',
    description: 'Aprende los fundamentos del hacking ético, metodologías de pruebas de penetración, y herramientas esenciales para auditorías de seguridad.',
    category_id: 1,
    level: 'beginner',
    status: 'activo',
    duration_hours: 30,
    duration_minutes: 0,
    price: 100.00,
    price_pyg: 750000,
    is_free: 0,
    requires_approval: 1,
    is_published: 1,
    is_featured: 0,
    payment_bank: 'Banco Familiar',
    payment_account: '81-9627954',
    payment_holder: 'GUILLERMO ANDRÉS RECALDE VALDEZ',
    payment_id: '5995260',
    payment_alias: '0982311865',
    payment_whatsapp: '+595 973 408 754',
    exchange_rate_usd: 7500,
    exchange_rate_ars: 7.50,
    exchange_rate_brl: 1450,
  },
  {
    title: 'Análisis Forense Digital',
    identifier: 'FOR001',
    slug: 'analisis-forense-digital',
    short_description: 'Técnicas de análisis forense en dispositivos digitales',
    description: 'Curso completo sobre análisis forense digital, recuperación de datos, y técnicas de investigación en dispositivos electrónicos.',
    category_id: 1,
    level: 'intermediate',
    status: 'activo',
    duration_hours: 35,
    duration_minutes: 0,
    price: 120.00,
    price_pyg: 900000,
    is_free: 0,
    requires_approval: 1,
    is_published: 1,
    is_featured: 1,
    payment_bank: 'Banco Familiar',
    payment_account: '81-9627954',
    payment_holder: 'GUILLERMO ANDRÉS RECALDE VALDEZ',
    payment_id: '5995260',
    payment_alias: '0982311865',
    payment_whatsapp: '+595 973 408 754',
    exchange_rate_usd: 7500,
    exchange_rate_ars: 7.50,
    exchange_rate_brl: 1450,
  },
  {
    title: 'Seguridad en Redes y Sistemas',
    identifier: 'NET001',
    slug: 'seguridad-redes-sistemas',
    short_description: 'Protección de infraestructura de red y sistemas',
    description: 'Aprende a proteger redes corporativas, configurar firewalls, implementar IDS/IPS, y gestionar la seguridad de sistemas operativos.',
    category_id: 1,
    level: 'intermediate',
    status: 'activo',
    duration_hours: 25,
    duration_minutes: 0,
    price: 90.00,
    price_pyg: 675000,
    is_free: 0,
    requires_approval: 0, // No requiere aprobación, pero es de pago
    is_published: 1,
    is_featured: 0,
    payment_bank: 'Banco Familiar',
    payment_account: '81-9627954',
    payment_holder: 'GUILLERMO ANDRÉS RECALDE VALDEZ',
    payment_id: '5995260',
    payment_alias: '0982311865',
    payment_whatsapp: '+595 973 408 754',
    exchange_rate_usd: 7500,
    exchange_rate_ars: 7.50,
    exchange_rate_brl: 1450,
  },
  {
    title: 'Malware Analysis y Reverse Engineering',
    identifier: 'MAL001',
    slug: 'malware-analysis-reverse-engineering',
    short_description: 'Análisis de malware e ingeniería inversa',
    description: 'Curso avanzado sobre análisis de malware, técnicas de ingeniería inversa, y herramientas para desarmar y analizar código malicioso.',
    category_id: 1,
    level: 'advanced',
    status: 'activo',
    duration_hours: 45,
    duration_minutes: 0,
    price: 180.00,
    price_pyg: 1350000,
    is_free: 0,
    requires_approval: 1,
    is_published: 1,
    is_featured: 1,
    payment_bank: 'Banco Familiar',
    payment_account: '81-9627954',
    payment_holder: 'GUILLERMO ANDRÉS RECALDE VALDEZ',
    payment_id: '5995260',
    payment_alias: '0982311865',
    payment_whatsapp: '+595 973 408 754',
    exchange_rate_usd: 7500,
    exchange_rate_ars: 7.50,
    exchange_rate_brl: 1450,
  },
  {
    title: 'Cloud Security Essentials',
    identifier: 'CLD001',
    slug: 'cloud-security-essentials',
    short_description: 'Seguridad en entornos cloud y servicios en la nube',
    description: 'Aprende a proteger aplicaciones y datos en la nube, configuración de seguridad en AWS, Azure y GCP, y mejores prácticas de cloud security.',
    category_id: 1,
    level: 'intermediate',
    status: 'activo',
    duration_hours: 28,
    duration_minutes: 0,
    price: 110.00,
    price_pyg: 825000,
    is_free: 0,
    requires_approval: 1,
    is_published: 1,
    is_featured: 0,
    payment_bank: 'Banco Familiar',
    payment_account: '81-9627954',
    payment_holder: 'GUILLERMO ANDRÉS RECALDE VALDEZ',
    payment_id: '5995260',
    payment_alias: '0982311865',
    payment_whatsapp: '+595 973 408 754',
    exchange_rate_usd: 7500,
    exchange_rate_ars: 7.50,
    exchange_rate_brl: 1450,
  },
];

async function createPaidCourses() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos');

    // Obtener la primera categoría disponible (o usar la que ya existe)
    const [categories] = await connection.execute(
      'SELECT id FROM course_categories LIMIT 1'
    );
    
    if (categories.length === 0) {
      console.log('⚠️ No hay categorías en la base de datos. Creando una categoría por defecto...');
      await connection.execute(
        `INSERT INTO course_categories (name, description, created_at) 
         VALUES ('Ciberseguridad', 'Cursos de ciberseguridad', NOW())`
      );
      const [newCategory] = await connection.execute(
        'SELECT id FROM course_categories WHERE name = ?',
        ['Ciberseguridad']
      );
      paidCourses.forEach(course => {
        course.category_id = newCategory[0].id;
      });
    } else {
      const categoryId = categories[0].id;
      paidCourses.forEach(course => {
        if (!course.category_id) {
          course.category_id = categoryId;
        }
      });
    }

    // Obtener un instructor por defecto (o el primero disponible)
    const [instructors] = await connection.execute(
      `SELECT id FROM users WHERE role = 'profesor' LIMIT 1`
    );

    if (instructors.length === 0) {
      console.log('⚠️ No hay instructores en la base de datos. Los cursos se crearán sin instructor asignado.');
    }

    // Crear fechas de inscripción (abiertas por defecto)
    const now = new Date();
    const enrollmentStart = new Date(now);
    enrollmentStart.setDate(now.getDate() - 7); // Inscripciones abiertas hace 7 días
    
    const enrollmentEnd = new Date(now);
    enrollmentEnd.setDate(now.getDate() + 30); // Cierran en 30 días

    const courseStart = new Date(now);
    courseStart.setDate(now.getDate() + 7); // El curso inicia en 7 días

    const courseEnd = new Date(courseStart);
    courseEnd.setDate(courseStart.getDate() + 60); // Dura 60 días

    console.log(`\n📚 Creando ${paidCourses.length} cursos de pago...\n`);

    for (const course of paidCourses) {
      try {
        // Verificar si el curso ya existe
        const [existing] = await connection.execute(
          'SELECT id FROM courses WHERE identifier = ? OR slug = ?',
          [course.identifier, course.slug]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Curso "${course.title}" ya existe (ID: ${existing[0].id}). Saltando...`);
          continue;
        }

        // Insertar el curso
        const [result] = await connection.execute(
          `INSERT INTO courses (
            title, identifier, slug, short_description, description, category_id, level, status,
            duration_hours, duration_minutes, price, price_pyg, is_free, 
            exchange_rate_usd, exchange_rate_ars, exchange_rate_brl, rates_snapshot_at,
            enrollment_start_date, enrollment_end_date, course_start_date, course_end_date, 
            requires_approval, is_featured, is_published,
            payment_bank, payment_account, payment_holder, payment_id, payment_alias, payment_whatsapp,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            course.title,
            course.identifier,
            course.slug,
            course.short_description,
            course.description,
            course.category_id,
            course.level,
            course.status,
            course.duration_hours,
            course.duration_minutes,
            course.price,
            course.price_pyg,
            course.is_free,
            course.exchange_rate_usd,
            course.exchange_rate_ars,
            course.exchange_rate_brl,
            enrollmentStart.toISOString().slice(0, 19).replace('T', ' '),
            enrollmentEnd.toISOString().slice(0, 19).replace('T', ' '),
            courseStart.toISOString().slice(0, 19).replace('T', ' '),
            courseEnd.toISOString().slice(0, 19).replace('T', ' '),
            course.requires_approval,
            course.is_featured,
            course.is_published,
            course.payment_bank,
            course.payment_account,
            course.payment_holder,
            course.payment_id,
            course.payment_alias,
            course.payment_whatsapp,
          ]
        );

        const courseId = result.insertId;
        console.log(`✅ Curso creado: "${course.title}" (ID: ${courseId}, Precio: USD ${course.price})`);

        // Asignar instructor si existe
        if (instructors.length > 0) {
          await connection.execute(
            'INSERT INTO course_instructors (course_id, instructor_id) VALUES (?, ?)',
            [courseId, instructors[0].id]
          );
          console.log(`   └─ Instructor asignado: ${instructors[0].id}`);
        }

      } catch (error) {
        console.error(`❌ Error al crear curso "${course.title}":`, error.message);
      }
    }

    console.log(`\n✅ Proceso completado. Se crearon cursos de pago para pruebas.`);
    console.log(`\n💡 Puedes probar el flujo de pago desde el dashboard del estudiante en /dashboard_estudiante/explore`);

  } catch (error) {
    console.error('❌ Error durante la creación de cursos:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Conexión cerrada');
    }
    await pool.end();
  }
}

createPaidCourses();

