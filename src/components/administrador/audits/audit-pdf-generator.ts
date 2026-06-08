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

export async function fetchAuditHtml(url: string): Promise<string> {
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
  return html;
}

/**
 * Download the audit HTML as a standalone .html file (with <base> injected
 * so relative assets keep resolving when the file is opened locally).
 */
export async function downloadAuditHtml(audit: AuditLike, lang?: "pt" | "en"): Promise<void> {
  const path = resolvePath(audit, lang);
  if (!path) throw new Error("Auditoria sem HTML");
  const html = await fetchAuditHtml(path);
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
  const html = await fetchAuditHtml(path);
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