<?php
/**
 * Script para verificar y crear la tabla certificate_templates si no existe
 */

require_once '../includes/roles.php';

echo "🔍 VERIFICANDO Y CREANDO TABLA CERTIFICATE_TEMPLATES\n";
echo "====================================================\n\n";

try {
    $pdo = connectDB();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    echo "✅ Conexión a base de datos establecida\n\n";
    
    // Verificar si la tabla certificate_templates existe
    echo "📋 PASO 1: Verificando si existe la tabla certificate_templates...\n";
    
    try {
        $stmt = $pdo->query("DESCRIBE certificate_templates");
        $columns = $stmt->fetchAll();
        
        echo "✅ La tabla certificate_templates YA existe con las siguientes columnas:\n";
        foreach ($columns as $column) {
            echo "  - " . $column['Field'] . " (" . $column['Type'] . ")\n";
        }
        
        // Mostrar algunos datos de ejemplo
        $stmt = $pdo->query("SELECT COUNT(*) FROM certificate_templates");
        $count = $stmt->fetchColumn();
        echo "  📊 Total de templates: $count\n";
        
        if ($count > 0) {
            $stmt = $pdo->query("SELECT id, name, is_default, is_active FROM certificate_templates LIMIT 5");
            $templates = $stmt->fetchAll();
            echo "  📋 Templates existentes:\n";
            foreach ($templates as $template) {
                echo "    - ID: {$template['id']} | {$template['name']} | Default: {$template['is_default']} | Active: {$template['is_active']}\n";
            }
        }
        
    } catch (Exception $e) {
        echo "❌ La tabla certificate_templates NO existe. Creándola...\n\n";
        
        // Crear la tabla certificate_templates
        echo "📋 PASO 2: Creando tabla certificate_templates...\n";
        
        $createTableSQL = "
        CREATE TABLE certificate_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            template_html LONGTEXT NOT NULL,
            is_default TINYINT(1) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        
        $pdo->exec($createTableSQL);
        echo "✅ Tabla certificate_templates creada exitosamente\n\n";
        
        // Crear template por defecto
        echo "📋 PASO 3: Creando template por defecto...\n";
        
        $defaultTemplate = '
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Certificado BITCAN</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 0;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                html, body {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    font-family: "Times New Roman", serif;
                    background: #ffffff;
                    overflow: hidden;
                }
                
                .certificate-container {
                    width: 100vw;
                    height: 100vh;
                    background: #ffffff;
                    border: 12px solid #2E5090;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                }
                
                /* Header */
                .certificate-header {
                    background: linear-gradient(135deg, #2E5090 0%, #1e3a5f 100%);
                    color: white;
                    padding: 25px 50px;
                    text-align: center;
                    height: 90px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    flex-shrink: 0;
                }
                
                .logo-text {
                    font-size: 3rem;
                    font-weight: bold;
                    letter-spacing: 4px;
                    margin-bottom: 5px;
                }
                
                .subtitle {
                    font-size: 1rem;
                    font-weight: 500;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    opacity: 0.9;
                }
                
                /* Body */
                .certificate-body {
                    flex: 1;
                    padding: 20px 70px 50px 70px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    background: #fafafa;
                    position: relative;
                    min-height: 0;
                }
                
                .certificate-logo {
                    max-width: 90px;
                    height: auto;
                    display: block;
                    margin: 0 auto 20px auto;
                    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.15));
                }
                
                .presentation-text {
                    font-size: 1.4rem;
                    color: #333;
                    margin-bottom: 20px;
                    font-weight: 500;
                }
                
                .certificate-title {
                    font-size: 3.2rem;
                    font-weight: bold;
                    color: #2E5090;
                    margin-bottom: 25px;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }
                
                .student-name {
                    font-size: 2.2rem;
                    font-weight: bold;
                    color: #2E5090;
                    margin-bottom: 25px;
                    border-bottom: 4px solid #2E5090;
                    padding-bottom: 15px;
                    min-width: 450px;
                }
                
                .achievement-text {
                    font-size: 1.4rem;
                    color: #333;
                    margin-bottom: 35px;
                    font-weight: 500;
                    max-width: 550px;
                    line-height: 1.5;
                }
                
                .course-name {
                    font-weight: bold;
                    color: #2E5090;
                    font-size: 1.5rem;
                }
                
                .certificate-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 35px;
                    padding: 25px 35px;
                    background: #ffffff;
                    border: 3px solid #e0e0e0;
                    width: 100%;
                    max-width: 750px;
                    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                }
                
                .detail-item {
                    text-align: center;
                    flex: 1;
                }
                
                .detail-label {
                    font-size: 0.9rem;
                    color: #666;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
                
                .detail-value {
                    font-size: 1.1rem;
                    color: #2E5090;
                    font-weight: bold;
                }
                
                /* Footer */
                .certificate-footer {
                    background: linear-gradient(135deg, #2E5090 0%, #1e3a5f 100%);
                    color: white;
                    padding: 25px 50px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 120px;
                    flex-shrink: 0;
                    width: 100%;
                }
                
                .instructor-notice {
                    font-size: 1.1rem;
                    font-weight: 500;
                    text-align: left;
                    line-height: 1.6;
                    max-width: 70%;
                    white-space: pre-line;
                }
                
                .instructor-name {
                    font-weight: bold;
                    font-size: 1.1rem;
                    display: block;
                    margin-top: 3px;
                }
                
                .certificate-number {
                    font-size: 1rem;
                    font-weight: bold;
                    text-align: right;
                    max-width: 30%;
                }
                
                /* Watermark */
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 5rem;
                    color: rgba(46, 80, 144, 0.06);
                    font-weight: bold;
                    pointer-events: none;
                    z-index: 1;
                }
                
                .security-pattern {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: transparent;
                    background-image: radial-gradient(circle, rgba(46, 80, 144, 0.12) 1.5px, transparent 1.5px);
                    background-size: 14px 14px;
                    background-position: 0 0;
                    pointer-events: none;
                    z-index: 0;
                }
                
                /* Ensure content is above patterns */
                .certificate-header,
                .certificate-body,
                .certificate-footer {
                    position: relative;
                    z-index: 2;
                }
                
                /* Decorative corners */
                .corner {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    border: 4px solid #2E5090;
                }
                
                .corner-tl {
                    top: 20px;
                    left: 20px;
                    border-right: none;
                    border-bottom: none;
                }
                
                .corner-tr {
                    top: 20px;
                    right: 20px;
                    border-left: none;
                    border-bottom: none;
                }
                
                .corner-bl {
                    bottom: 20px;
                    left: 20px;
                    border-right: none;
                    border-top: none;
                }
                
                .corner-br {
                    bottom: 20px;
                    right: 20px;
                    border-left: none;
                    border-top: none;
                }
                
                /* Print styles */
                @media print {
                    html, body {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .certificate-container {
                        width: 100%;
                        height: 100%;
                        border: 12px solid #2E5090;
                    }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                <!-- Security pattern con motas -->
                <div class="security-pattern"></div>
                
                <!-- Watermark -->
                <div class="watermark">BITCAN</div>
                
                <!-- Decorative corners -->
                <div class="corner corner-tl"></div>
                <div class="corner corner-tr"></div>
                <div class="corner corner-bl"></div>
                <div class="corner corner-br"></div>
                
                <!-- Header -->
                <div class="certificate-header">
                    <div class="logo-text">BITCAN</div>
                    <div class="subtitle">Prevención a través de la Educación</div>
                </div>
                
                <!-- Body -->
                <div class="certificate-body">
                    <img src="https://bitcan.com.py/bitcan-logo.png" alt="Logo BITCAN" class="certificate-logo">
        
                    <div class="presentation-text">Se otorga el presente</div>
                    
                    <div class="certificate-title">Certificado</div>
                    
                    <div class="presentation-text">a</div>
                    
                    <div class="student-name">{{STUDENT_NAME}}</div>
                    
                    <div class="achievement-text">
                        por haber completado exitosamente el curso<br>
                        <span class="course-name">"{{COURSE_NAME}}"</span>
                    </div>
                    
                    <div class="certificate-details">
                        <div class="detail-item">
                            <div class="detail-label">Horas Cursadas</div>
                            <div class="detail-value">{{DURATION_HOURS}} horas</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Fecha de Inicio</div>
                            <div class="detail-value">{{START_DATE}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Fecha de Finalización</div>
                            <div class="detail-value">{{COMPLETION_DATE}}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="certificate-footer">
                    <div class="instructor-notice">
                        {{CUSTOM_SIGNATURE}}
                    </div>
                    
                    <div class="certificate-number">
                        Certificado N°: {{CERTIFICATE_NUMBER}}
                    </div>
                </div>
            </div>
        </body>
        </html>';
        
        $stmt = $pdo->prepare("
            INSERT INTO certificate_templates (name, description, template_html, is_default, is_active, created_by) 
            VALUES (?, ?, ?, 1, 1, 1)
        ");
        
        $stmt->execute([
            'Template BITCAN Default',
            'Template por defecto para certificados de BITCAN con diseño profesional',
            $defaultTemplate
        ]);
        
        echo "✅ Template por defecto creado exitosamente\n\n";
        
        // Verificar estructura final
        echo "📋 PASO 4: Verificando estructura final...\n";
        $stmt = $pdo->query("DESCRIBE certificate_templates");
        $columns = $stmt->fetchAll();
        
        echo "✅ Tabla certificate_templates creada con las siguientes columnas:\n";
        foreach ($columns as $column) {
            echo "  - " . $column['Field'] . " (" . $column['Type'] . ")\n";
        }
    }
    
    echo "\n🎉 PROCESO COMPLETADO EXITOSAMENTE\n";
    echo "La tabla certificate_templates está lista para usar.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

