import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener configuración del sistema
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener configuraciones
    const configs = await query(
      'SELECT config_key, config_value FROM system_config ORDER BY config_key'
    );

    // Convertir a objeto
    const config: { [key: string]: string } = {};
    configs.forEach((configItem: any) => {
      config[configItem.config_key] = configItem.config_value;
    });

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Guardar configuración del sistema
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { config_type, config } = body;

    if (!config_type || !config) {
      return NextResponse.json(
        { error: 'Datos de configuración inválidos' },
        { status: 400 }
      );
    }

    let success = true;
    let message = 'Configuración guardada exitosamente';

    try {
      // Iniciar transacción
      await query('START TRANSACTION');

      // Guardar cada configuración
      for (const [key, value] of Object.entries(config)) {
        await query(`
          INSERT INTO system_config (config_key, config_value, updated_at) 
          VALUES (?, ?, NOW()) 
          ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()
        `, [key, value, value]);
      }

      // Registrar en logs de auditoría
      await query(`
        INSERT INTO system_audit_log (user_id, action, details, created_at) 
        VALUES (?, 'update_config', ?, NOW())
      `, [decoded.id, `Actualizada configuración: ${config_type}`]);

      // Confirmar transacción
      await query('COMMIT');

    } catch (transactionError) {
      // Revertir transacción
      await query('ROLLBACK');
      success = false;
      message = 'Error al guardar configuración';
      throw transactionError;
    }

    return NextResponse.json({
      success,
      message
    });

  } catch (error) {
    console.error('Error saving system config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


