import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const courseId = parseInt(params.id);

    // Verificar que el profesor es instructor del curso
    const instructorCheck = await query(`
      SELECT ci.course_id
      FROM course_instructors ci
      WHERE ci.course_id = ? AND ci.instructor_id = ?
    `, [courseId, instructorId]);

    if (!instructorCheck || instructorCheck.length === 0) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a este curso' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const url = formData.get('url') as string;
    const file = formData.get('file') as File | null;

    if (!title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    // Si hay archivo, subirlo
    let file_path = null;
    let file_size = null;
    let file_type = null;

    if (file && file.size > 0) {
      // Crear directorio si no existe
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'course_resources');
      await mkdir(uploadDir, { recursive: true });

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = join(uploadDir, fileName);

      // Guardar archivo
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      file_path = `/uploads/course_resources/${fileName}`;
      file_size = file.size;
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
      file_type = mimeTypeMap[normalizedType] || normalizedType.substring(0, 50);
    }

    // Si no hay archivo ni URL, retornar error
    if (!file_path && !url) {
      return NextResponse.json(
        { error: 'Debe proporcionar un archivo o una URL' },
        { status: 400 }
      );
    }

    // Insertar recurso en la base de datos
    const result = await query(`
      INSERT INTO course_resources (
        course_id, title, description, file_path, url, file_size, file_type, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [courseId, title, description || null, file_path, url || null, file_size, file_type, instructorId]);

    const resourceId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      message: 'Recurso creado exitosamente',
      id: resourceId
    });

  } catch (error) {
    console.error('Error creating course resource:', error);
    return NextResponse.json(
      { error: 'Error al crear el recurso' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const courseId = parseInt(params.id);

    // Verificar que el profesor es instructor del curso
    const instructorCheck = await query(`
      SELECT ci.course_id
      FROM course_instructors ci
      WHERE ci.course_id = ? AND ci.instructor_id = ?
    `, [courseId, instructorId]);

    if (!instructorCheck || instructorCheck.length === 0) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a este curso' },
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
      SELECT file_path FROM course_resources
      WHERE id = ? AND course_id = ?
    `, [resourceId, courseId]);

    if (!resource || resource.length === 0) {
      return NextResponse.json(
        { error: 'Recurso no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar archivo físico si existe
    if (resource[0].file_path) {
      try {
        const { unlink } = await import('fs/promises');
        const filePath = join(process.cwd(), 'public', resource[0].file_path);
        await unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continuar aunque falle la eliminación del archivo
      }
    }

    // Eliminar de la base de datos
    await query(`
      DELETE FROM course_resources
      WHERE id = ? AND course_id = ?
    `, [resourceId, courseId]);

    return NextResponse.json({
      success: true,
      message: 'Recurso eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting course resource:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el recurso' },
      { status: 500 }
    );
  }
}

