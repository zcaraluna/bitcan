import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const instructorId = decoded.id;
    const lessonId = parseInt(params.lessonId);

    // Verificar que el profesor es instructor del curso de la lección
    const lessonCheck = await queryOne(`
      SELECT l.course_id
      FROM lessons l
      JOIN course_instructors ci ON l.course_id = ci.course_id
      WHERE l.id = ? AND ci.instructor_id = ?
    `, [lessonId, instructorId]);

    if (!lessonCheck) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta lección' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File | null;

    if (!title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar un archivo' },
        { status: 400 }
      );
    }

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'lesson_resources');
    await mkdir(uploadDir, { recursive: true });

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadDir, fileName);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const file_url = `/uploads/lesson_resources/${fileName}`;
    const file_size = file.size;
    // Normalizar y limitar file_type
    const rawFileType = file.type || 'application/octet-stream';
    let normalizedType = rawFileType.split(';')[0].trim();
    
    // Mapeo de tipos MIME largos a versiones más cortas
    const mimeTypeMap: Record<string, string> = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'application/vnd.ms-powerpoint',
      'application/vnd.ms-excel': 'application/vnd.ms-excel',
      'application/msword': 'application/msword',
      'application/vnd.ms-powerpoint': 'application/vnd.ms-powerpoint',
    };
    
    // Usar mapeo si existe, sino usar el tipo original limitado a 50 caracteres
    const file_type = mimeTypeMap[normalizedType] || normalizedType.substring(0, 50);

    // Insertar recurso en la base de datos
    const result = await query(`
      INSERT INTO lesson_resources (
        lesson_id, title, description, file_url, file_size, file_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [lessonId, title, description || null, file_url, file_size, file_type]);

    const resourceId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      message: 'Recurso creado exitosamente',
      id: resourceId
    });

  } catch (error) {
    console.error('Error creating lesson resource:', error);
    return NextResponse.json(
      { error: 'Error al crear el recurso' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const instructorId = decoded.id;
    const lessonId = parseInt(params.lessonId);

    // Verificar que el profesor es instructor del curso de la lección
    const lessonCheck = await queryOne(`
      SELECT l.course_id
      FROM lessons l
      JOIN course_instructors ci ON l.course_id = ci.course_id
      WHERE l.id = ? AND ci.instructor_id = ?
    `, [lessonId, instructorId]);

    if (!lessonCheck) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta lección' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json(
        { error: 'ID de recurso requerido' },
        { status: 400 }
      );
    }

    // Obtener información del archivo antes de eliminar
    const resource = await query(`
      SELECT file_url FROM lesson_resources
      WHERE id = ? AND lesson_id = ?
    `, [resourceId, lessonId]);

    if (!resource || resource.length === 0) {
      return NextResponse.json(
        { error: 'Recurso no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar archivo físico si existe
    if (resource[0].file_url) {
      try {
        const { unlink } = await import('fs/promises');
        const filePath = join(process.cwd(), 'public', resource[0].file_url);
        await unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continuar aunque falle la eliminación del archivo
      }
    }

    // Eliminar de la base de datos
    await query(`
      DELETE FROM lesson_resources
      WHERE id = ? AND lesson_id = ?
    `, [resourceId, lessonId]);

    return NextResponse.json({
      success: true,
      message: 'Recurso eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting lesson resource:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el recurso' },
      { status: 500 }
    );
  }
}

