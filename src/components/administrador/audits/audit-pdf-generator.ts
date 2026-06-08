// Audit report helpers — content-type agnostic.
// We never trust the storage object's MIME (it has flipped to text/plain in
// the past). Instead we always fetch the HTML as text and either render it
// inline via <iframe srcDoc> or open it in a popup that auto-triggers the
// native browser "Save as PDF" dialog.

interface AuditLike {
  id: string;
  version: string;
  html_path: string | null;
  html_path_en?: string | null;
}

function resolvePath(audit: AuditLike, lang?: "pt" | "en"): string {
  if (lang === "en" && audit.html_path_en) return audit.html_path_en;
  return audit.html_path || "";
}

const CONFIDENTIAL_COPY = {
  pt: {
    tag: "CONFIDENCIAL",
    banner:
      "Documento confidencial — uso interno e parceiros sob NDA. Não redistribuir.",
    footer:
      "Confidencial · Senex AI / PetMoreTime · Conteúdo técnico para revisão interna; sujeito a alterações. As recomendações descritas não substituem julgamento clínico-veterinário.",
  },
  en: {
    tag: "CONFIDENTIAL",
    banner:
      "Confidential document — internal use and NDA partners only. Do not redistribute.",
    footer:
      "Confidential · Senex AI / PetMoreTime · Technical content for internal review; subject to change. Recommendations described do not replace clinical-veterinary judgement.",
  },
} as const;

function injectConfidentialMarks(html: string, lang: "pt" | "en"): string {
  const copy = CONFIDENTIAL_COPY[lang];
  if (/data-senex-confidential/i.test(html)) return html;

  const styles = `
<style data-senex-confidential="style">
  .senex-confidential-banner{position:relative;margin:0 0 1.2em;padding:10px 14px 10px 56px;border:1px solid #c9a84c;background:#fff8e1;color:#5a3e00;font:600 13px/1.35 Georgia,serif;border-radius:4px}
  .senex-confidential-banner::before{content:attr(data-tag);position:absolute;left:8px;top:50%;transform:translateY(-50%);background:#8b1e1e;color:#fff;font:700 10px/1 Arial,sans-serif;letter-spacing:.08em;padding:4px 6px;border-radius:3px}
  .senex-confidential-footer{margin-top:2em;padding:10px 14px;border-top:1px solid #c9a84c;color:#4a5568;font:italic 11px/1.4 Georgia,serif}
  @media print{
    .senex-confidential-banner{background:#fff8e1 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body::before{content:attr(data-watermark);position:fixed;top:40%;left:0;right:0;text-align:center;font:700 84px/1 Arial,sans-serif;color:rgba(139,30,30,0.08);transform:rotate(-28deg);pointer-events:none;z-index:0}
  }
</style>`;

  const banner = `<div class="senex-confidential-banner" data-tag="${copy.tag}" data-senex-confidential="banner">${copy.banner}</div>`;
  const footer = `<div class="senex-confidential-footer" data-senex-confidential="footer">${copy.footer}</div>`;

  if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `${styles}</head>`);
  else html = styles + html;

  if (/<body[^>]*>/i.test(html)) {
    html = html.replace(/<body([^>]*)>/i, (_m, attrs) => {
      const hasWatermark = /data-watermark=/i.test(attrs);
      const newAttrs = hasWatermark ? attrs : `${attrs} data-watermark="${copy.tag}"`;
      return `<body${newAttrs}>${banner}`;
    });
  } else {
    html = banner + html;
  }

  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${footer}</body>`);
  else html = html + footer;

  return html;
}

function detectLang(url: string, lang?: "pt" | "en"): "pt" | "en" {
  if (lang) return lang;
  return /\.en\.html?$/i.test(url) ? "en" : "pt";
}

export async function fetchAuditHtml(url: string, lang?: "pt" | "en"): Promise<string> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Falha ao baixar HTML (${r.status})`);
  let html = await r.text();

  // Some legacy audits in /public/audits/<v>/index.html use relative
  // references (style.css, media/...). Inject a <base> so they still resolve
  // correctly when the HTML is served via srcDoc or via a blob popup.
  try {
    const base = new URL(url, window.location.href);
    const baseHref = base.href.replace(/[^/]*$/, "");
    if (!/<base\s/i.test(html)) {
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
      } else {
        html = `<head><base href="${baseHref}"></head>` + html;
      }
    }
  } catch {
    /* noop */
  }
  return injectConfidentialMarks(html, detectLang(url, lang));
}

/**
 * Download the audit HTML as a standalone .html file (with <base> injected
 * so relative assets keep resolving when the file is opened locally).
 */
export async function downloadAuditHtml(audit: AuditLike, lang?: "pt" | "en"): Promise<void> {
  const path = resolvePath(audit, lang);
  if (!path) throw new Error("Auditoria sem HTML");
  const html = await fetchAuditHtml(path, lang);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `senex-audit-v${audit.version}${lang === "en" ? "-en" : ""}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Open the audit HTML in a new tab/window and trigger the native print
 * dialog. Users save as PDF from the browser — works in every browser,
 * preserves Unicode and styling, and avoids the broken html2pdf path.
 */
export async function openAuditForPrint(audit: AuditLike, lang?: "pt" | "en"): Promise<void> {
  const path = resolvePath(audit, lang);
  if (!path) throw new Error("Auditoria sem HTML");
  const html = await fetchAuditHtml(path, lang);
  const printScript = `
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.focus(); window.print(); }, 350);
  });
</script>`;
  const finalHtml = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${printScript}</body>`)
    : html + printScript;

  const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // Popup blocked — fall back to same-tab navigation.
    window.location.href = url;
    return;
  }
  // Release the blob URL once the popup has had time to parse it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}