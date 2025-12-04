import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { writeFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { html } = body;

    if (!html) {
      return NextResponse.json({ error: 'HTML requerido' }, { status: 400 });
    }

    // Rutas posibles de wkhtmltopdf
    const wkhtmltopdfPaths = [
      'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
      'C:\\Program Files (x86)\\wkhtmltopdf\\bin\\wkhtmltopdf.exe',
      '/usr/bin/wkhtmltopdf',
      '/usr/local/bin/wkhtmltopdf',
      '/opt/wkhtmltopdf/bin/wkhtmltopdf',
      'wkhtmltopdf' // PATH del sistema
    ];

    // Encontrar wkhtmltopdf
    let wkhtmltopdfPath = '';
    for (const path of wkhtmltopdfPaths) {
      try {
        // Intentar verificar si el archivo existe (solo para rutas absolutas)
        if (path.includes('/') || path.includes('\\')) {
          const { existsSync } = await import('fs');
          if (existsSync(path)) {
            wkhtmltopdfPath = path;
            break;
          }
        } else {
          // Para 'wkhtmltopdf' sin ruta, asumimos que está en PATH
          wkhtmltopdfPath = path;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!wkhtmltopdfPath) {
      wkhtmltopdfPath = 'wkhtmltopdf'; // Intentar con PATH como último recurso
    }

    // Crear archivos temporales
    const timestamp = Date.now();
    const tempHtmlFile = join(tmpdir(), `cert_preview_${timestamp}.html`);
    const tempPdfFile = join(tmpdir(), `cert_preview_${timestamp}.pdf`);

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
            // Limpiar archivos temporales
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

          // Devolver el PDF
          resolve(new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="preview-certificado-${timestamp}.pdf"`,
              'Content-Length': pdfBuffer.length.toString(),
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
        // Limpiar archivos temporales
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
    console.error('Error in preview PDF:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


