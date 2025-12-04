import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('📎 UPLOAD API - Iniciando upload...');
    
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.log('📎 UPLOAD API - No hay token');
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('📎 UPLOAD API - Token inválido');
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const formData = await request.formData();
    console.log('📎 UPLOAD API - FormData keys:', Array.from(formData.keys()));
    
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string;

    console.log('📎 UPLOAD API - Archivo recibido:', file?.name, 'Tamaño:', file?.size);
    console.log('📎 UPLOAD API - MessageId recibido:', messageId);

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'messages');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // El directorio ya existe
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = join(uploadDir, fileName);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Guardar en base de datos
    const relativePath = `/uploads/messages/${fileName}`;
    const fileType = file.type || 'application/octet-stream';
    
    if (messageId) {
      console.log('📎 UPLOAD API - Guardando en BD:', { messageId, fileName, relativePath });
      await query(`
        INSERT INTO message_attachments (message_id, file_name, file_path, file_size, file_type, original_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [messageId, fileName, relativePath, file.size, fileType, file.name]);
      console.log('📎 UPLOAD API - Guardado exitoso en BD');
    } else {
      console.log('📎 UPLOAD API - No hay messageId, no se guarda en BD');
    }

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: file.name,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error al subir archivo' },
      { status: 500 }
    );
  }
}

