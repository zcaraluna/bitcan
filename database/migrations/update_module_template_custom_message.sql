-- Actualizar plantilla de módulo para incluir CUSTOM_MESSAGE en el footer
UPDATE certificate_templates
SET template_html = REPLACE(
    template_html,
    '<div class="instructor-notice">{{CUSTOM_SIGNATURE}}</div>',
    '<div class="instructor-notice">{{CUSTOM_SIGNATURE}}{{#if CUSTOM_MESSAGE}}<div style="margin-top: 15px; font-size: 0.95rem; font-weight: 400; line-height: 1.5;">{{CUSTOM_MESSAGE}}</div>{{/if}}</div>'
)
WHERE template_html LIKE '%MODULE_NAME%' 
   OR template_html LIKE '%por haber completado exitosamente el módulo%';

