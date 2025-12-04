import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { writeFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const certificateId = params.id;

    // Obtener certificado de la base de datos
    const certificate = await queryOne(`
      SELECT 
        c.*,
        u.name as student_name,
        u.email as student_email,
        co.title as course_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.id = ?
    `, [certificateId]);

    if (!certificate) {
      return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 });
    }

    const certificateData = JSON.parse(certificate.certificate_data);
    const html = certificateData.html;

    if (!html) {
      return NextResponse.json({ error: 'HTML del certificado no encontrado' }, { status: 404 });
    }

    // Rutas posibles de wkhtmltopdf
    const wkhtmltopdfPaths = [
      'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
      'C:\\Program Files (x86)\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
      '/usr/bin/wkhtmltopdf',
      '/usr/local/bin/wkhtmltopdf',
      '/opt/wkhtmltopdf/bin/wkhtmltopdf',
      'wkhtmltopdf'
    ];

    let wkhtmltopdfPath = '';
    for (const path of wkhtmltopdfPaths) {
      try {
        if (path.includes('/') || path.includes('\\')) {
          const { existsSync } = await import('fs');
          if (existsSync(path)) {
            wkhtmltopdfPath = path;
            break;
          }
        } else {
          wkhtmltopdfPath = path;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!wkhtmltopdfPath) {
      wkhtmltopdfPath = 'wkhtmltopdf';
    }

    // Crear archivos temporales
    const timestamp = Date.now();
    const tempHtmlFile = join(tmpdir(), `cert_${certificateId}_${timestamp}.html`);
    const tempPdfFile = join(tmpdir(), `cert_${certificateId}_${timestamp}.pdf`);

    // El HTML del certificado YA es un documento completo - NO envolverlo
    // Esto es EXACTAMENTE lo que hace el PHP: usar el HTML tal como viene de la BD
    await writeFile(tempHtmlFile, html, 'utf-8');

    // Comando wkhtmltopdf EXACTAMENTE como PHP - sin opciones extras
    const args = [
      '--page-size', 'A4',
      '--orientation', 'Landscape',
      '--margin-top', '0',
      '--margin-right', '0',
      '--margin-bottom', '0',
      '--margin-left', '0',
      '--encoding', 'UTF-8',
      '--no-outline',
      '--disable-smart-shrinking',
      tempHtmlFile,
      tempPdfFile
    ];

    return new Promise<NextResponse>((resolve) => {
      const process = spawn(wkhtmltopdfPath, args);
      
      let stderr = '';
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', async (code) => {
        try {
          if (code !== 0) {
            await unlink(tempHtmlFile).catch(() => {});
            await unlink(tempPdfFile).catch(() => {});
            
            resolve(NextResponse.json({ 
              error: 'Error al generar PDF',
              details: stderr,
              wkhtmltopdfPath: wkhtmltopdfPath
            }, { status: 500 }));
            return;
          }

          // Leer el PDF generado
          const { readFile } = await import('fs/promises');
          const pdfBuffer = await readFile(tempPdfFile);

          // Limpiar archivos temporales
          await unlink(tempHtmlFile).catch(() => {});
          await unlink(tempPdfFile).catch(() => {});

          // Nombre del archivo
          const filename = `Certificado_${certificate.student_name}_${certificate.certificate_number}.pdf`
            .replace(/[^a-zA-Z0-9_-]/g, '_');

          // Devolver el PDF
          resolve(new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': pdfBuffer.length.toString(),
              'Cache-Control': 'private, max-age=0, must-revalidate',
              'Pragma': 'public'
            },
          }));
        } catch (error) {
          console.error('Error processing PDF:', error);
          resolve(NextResponse.json({ 
            error: 'Error al procesar PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 }));
        }
      });

      process.on('error', async (error) => {
        await unlink(tempHtmlFile).catch(() => {});
        await unlink(tempPdfFile).catch(() => {});
        
        resolve(NextResponse.json({ 
          error: 'wkhtmltopdf no está instalado o no es accesible',
          details: error.message,
          wkhtmltopdfPath: wkhtmltopdfPath,
          suggestion: 'Instala wkhtmltopdf desde https://wkhtmltopdf.org/downloads.html'
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Error downloading certificate PDF:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
