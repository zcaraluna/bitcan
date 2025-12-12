/**
 * Generador de PDF con Puppeteer
 * Reemplazo moderno de wkhtmltopdf
 */

import puppeteer, { Browser, Page } from 'puppeteer';
// import { PDFGenerationOptions } from '@/types/certificates';

export class PDFGenerator {
  private browser: Browser | null = null;

  /**
   * Inicializar navegador
   */
  private async initBrowser(): Promise<Browser> {
    // Verificar si el navegador existe y está conectado
    if (this.browser) {
      try {
        // Verificar si el navegador sigue conectado
        const pages = await this.browser.pages();
        return this.browser;
      } catch (error) {
        // El navegador se cerró, crear uno nuevo
        console.warn('⚠️ Navegador anterior se cerró, creando uno nuevo');
        this.browser = null;
      }
    }

    console.log('🚀 Iniciando nuevo navegador Puppeteer...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--metrics-recording-only',
        '--window-size=1920x1080',
        '--single-process', // Útil para servidores con recursos limitados
        '--disable-web-security', // Para evitar problemas con CORS en recursos locales
      ],
      timeout: 60000, // 60 segundos para iniciar
    });

    // Manejar cierre inesperado del navegador
    this.browser.on('disconnected', () => {
      console.warn('⚠️ Navegador Puppeteer se desconectó inesperadamente');
      this.browser = null;
    });

    console.log('✅ Navegador Puppeteer iniciado correctamente');
    return this.browser;
  }

  /**
   * Cerrar navegador
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generar PDF desde HTML
   */
  async generatePDF(
    html: string,
    options: any = {}
  ): Promise<Buffer> {
    let page: Page | null = null;
    let retries = 2; // Intentar hasta 2 veces

    while (retries > 0) {
      try {
        const browser = await this.initBrowser();
        page = await browser.newPage();

        // Configurar timeouts más largos
        page.setDefaultNavigationTimeout(60000); // 60 segundos
        page.setDefaultTimeout(60000);

        // Configurar viewport para mejor renderizado
        await page.setViewport({
          width: 1920,
          height: 1080,
          deviceScaleFactor: 2, // Para mejor calidad
        });

        // Cargar el HTML con timeout más largo
        await page.setContent(html, {
          waitUntil: ['load', 'networkidle0'],
          timeout: 60000, // Aumentado a 60 segundos
        });

        // Esperar a que todas las fuentes e imágenes se carguen
        await page.evaluateHandle('document.fonts.ready');
        await this.waitForImages(page);

        // Opciones predeterminadas
        const pdfOptions = {
          format: options.format || 'A4',
          landscape: options.orientation === 'landscape',
          printBackground: options.printBackground !== false,
          margin: options.margin || {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm',
          },
          displayHeaderFooter: options.displayHeaderFooter || false,
          preferCSSPageSize: options.preferCSSPageSize || false,
        };

        // Generar PDF
        const pdf = await page.pdf(pdfOptions);

        if (page) {
          await page.close().catch(() => {}); // Ignorar errores al cerrar
        }

        return Buffer.from(pdf);
      } catch (error) {
        console.error(`❌ Error generando PDF (intentos restantes: ${retries - 1}):`, error);
        
        // Cerrar página si existe
        if (page) {
          try {
            await page.close();
          } catch (e) {
            // Ignorar errores al cerrar
          }
        }

        // Si el error es de conexión cerrada, forzar recrear el navegador
        if (error instanceof Error && error.message.includes('Connection closed')) {
          console.warn('⚠️ Conexión cerrada, forzando recreación del navegador');
          await this.closeBrowser();
          this.browser = null;
        }

        retries--;

        if (retries === 0) {
          throw new Error(`Error generando PDF después de múltiples intentos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }

        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('No se pudo generar el PDF');
  }

  /**
   * Esperar a que todas las imágenes se carguen
   */
  private async waitForImages(page: Page): Promise<void> {
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        })
      );
    });
  }

  /**
   * Generar screenshot (útil para preview)
   */
  async generateScreenshot(
    html: string,
    options: { width?: number; height?: number; fullPage?: boolean } = {}
  ): Promise<Buffer> {
    let page: Page | null = null;
    let retries = 2;

    while (retries > 0) {
      try {
        const browser = await this.initBrowser();
        page = await browser.newPage();

        // Configurar timeouts más largos
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);

        await page.setViewport({
          width: options.width || 1920,
          height: options.height || 1080,
          deviceScaleFactor: 2,
        });

        await page.setContent(html, {
          waitUntil: ['load', 'networkidle0'],
          timeout: 60000,
        });

        await page.evaluateHandle('document.fonts.ready');
        await this.waitForImages(page);

        const screenshot = await page.screenshot({
          fullPage: options.fullPage !== false,
          type: 'png',
        });

        if (page) {
          await page.close().catch(() => {});
        }

        return Buffer.from(screenshot);
      } catch (error) {
        console.error(`❌ Error generando screenshot (intentos restantes: ${retries - 1}):`, error);
        
        if (page) {
          try {
            await page.close();
          } catch (e) {
            // Ignorar errores al cerrar
          }
        }

        if (error instanceof Error && error.message.includes('Connection closed')) {
          console.warn('⚠️ Conexión cerrada, forzando recreación del navegador');
          await this.closeBrowser();
          this.browser = null;
        }

        retries--;

        if (retries === 0) {
          throw new Error(`Error generando screenshot después de múltiples intentos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('No se pudo generar el screenshot');
  }
}

// Instancia singleton
let pdfGeneratorInstance: PDFGenerator | null = null;

/**
 * Obtener instancia del generador
 */
export function getPDFGenerator(): PDFGenerator {
  if (!pdfGeneratorInstance) {
    pdfGeneratorInstance = new PDFGenerator();
  }
  return pdfGeneratorInstance;
}

/**
 * Limpiar recursos
 */
export async function cleanupPDFGenerator(): Promise<void> {
  if (pdfGeneratorInstance) {
    await pdfGeneratorInstance.closeBrowser();
    pdfGeneratorInstance = null;
  }
}








