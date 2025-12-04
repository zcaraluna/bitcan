import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');
    const type = searchParams.get('type'); // 'course' o 'lesson'

    if (!resourceId || !type) {
      return NextResponse.json(
        { error: 'ID de recurso y tipo son requeridos' },
        { status: 400 }
      );
    }

    // Obtener información del recurso
    let resource;
    if (type === 'course') {
      resource = await queryOne(`
        SELECT cr.*, c.id as course_id
        FROM course_resources cr
        JOIN courses c ON cr.course_id = c.id
        WHERE cr.id = ?
      `, [resourceId]);

      if (!resource) {
        return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
      }

      // Verificar permisos según el rol
      if (decoded.role === 'estudiante') {
        // Verificar que el estudiante esté inscrito en el curso
        const enrollment = await queryOne(`
          SELECT id FROM user_courses
          WHERE user_id = ? AND course_id = ?
        `, [decoded.id, resource.course_id]);

        if (!enrollment) {
          return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }
      } else if (decoded.role === 'profesor') {
        // Verificar que el profesor sea instructor del curso
        const instructorCheck = await queryOne(`
          SELECT id FROM course_instructors
          WHERE course_id = ? AND instructor_id = ?
        `, [resource.course_id, decoded.id]);

        if (!instructorCheck) {
          return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }
      }

      if (!resource.file_path) {
        return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
      }

      // Leer archivo
      const filePath = join(process.cwd(), 'public', resource.file_path);
      const fileBuffer = await readFile(filePath);

      // Obtener nombre del archivo original
      const fileName = resource.file_path.split('/').pop() || 'archivo';

      // Determinar content type
      const contentType = resource.file_type || 'application/octet-stream';

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } else if (type === 'lesson') {
      resource = await queryOne(`
        SELECT lr.*, l.course_id
        FROM lesson_resources lr
        JOIN lessons l ON lr.lesson_id = l.id
        WHERE lr.id = ?
      `, [resourceId]);

      if (!resource) {
        return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
      }

      // Verificar permisos según el rol
      if (decoded.role === 'estudiante') {
        // Verificar que el estudiante esté inscrito en el curso
        const enrollment = await queryOne(`
          SELECT id FROM user_courses
          WHERE user_id = ? AND course_id = ?
        `, [decoded.id, resource.course_id]);

        if (!enrollment) {
          return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }
      } else if (decoded.role === 'profesor') {
        // Verificar que el profesor sea instructor del curso
        const instructorCheck = await queryOne(`
          SELECT id FROM course_instructors
          WHERE course_id = ? AND instructor_id = ?
        `, [resource.course_id, decoded.id]);

        if (!instructorCheck) {
          return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }
      }

      if (!resource.file_url) {
        return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
      }

      // Leer archivo
      const filePath = join(process.cwd(), 'public', resource.file_url);
      const fileBuffer = await readFile(filePath);

      // Obtener nombre del archivo original
      const fileName = resource.file_url.split('/').pop() || 'archivo';

      // Determinar content type
      const contentType = resource.file_type || 'application/octet-stream';

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } else {
      return NextResponse.json({ error: 'Tipo de recurso inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error downloading resource:', error);
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Archivo no encontrado en el servidor' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Error al descargar el recurso' },
      { status: 500 }
    );
  }
}

