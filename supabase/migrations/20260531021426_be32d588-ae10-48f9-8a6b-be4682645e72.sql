UPDATE public.technical_audits
SET html_path = '/audits/v5.1.0/index.html',
    pdf_path  = '/audits/v5.1.0/auditoria.pdf',
    docx_path = '/audits/v5.1.0/auditoria.docx',
    updated_at = now()
WHERE id = 'v5.1.0';