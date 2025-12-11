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
    if (this.browser) {
      return this.browser;
    }

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
      ],
    });

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
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Configurar viewport para mejor renderizado
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2, // Para mejor calidad
      });

      // Cargar el HTML
      await page.setContent(html, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000,
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

      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
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
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({
        width: options.width || 1920,
        height: options.height || 1080,
        deviceScaleFactor: 2,
      });

      await page.setContent(html, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000,
      });

      await page.evaluateHandle('document.fonts.ready');
      await this.waitForImages(page);

      const screenshot = await page.screenshot({
        fullPage: options.fullPage !== false,
        type: 'png',
      });

      return Buffer.from(screenshot);
    } finally {
      await page.close();
    }
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








