// Client-side HTML → PDF generator for audit reports.
// Uses html2pdf.js to render the audit HTML in an offscreen iframe and
// uploads the resulting PDF to the `audit-reports` storage bucket, then
// updates the technical_audits row with the public PDF URL.

import html2pdf from "html2pdf.js";
import { supabase } from "@/integrations/supabase/client";

interface AuditLike {
  id: string;
  version: string;
  html_path: string | null;
  pdf_path: string | null;
}

const BUCKET = "audit-reports";

async function fetchHtml(url: string): Promise<string> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to fetch HTML (${r.status})`);
  return await r.text();
}

function renderInIframe(html: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "800px";
    iframe.style.height = "1200px";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);
    iframe.onload = () => setTimeout(() => resolve(iframe), 400);
    iframe.onerror = () => reject(new Error("iframe load failed"));
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
  });
}

export async function generateAuditPdf(audit: AuditLike): Promise<string | null> {
  if (!audit.html_path) return null;
  if (audit.pdf_path) return audit.pdf_path;

  let iframe: HTMLIFrameElement | null = null;
  try {
    const html = await fetchHtml(audit.html_path);
    iframe = await renderInIframe(html);
    const root = iframe.contentDocument?.body;
    if (!root) throw new Error("iframe body missing");

    const blob: Blob = await html2pdf()
      .from(root)
      .set({
        margin: [10, 10, 10, 10],
        filename: `auditoria-${audit.version}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as any)
      .outputPdf("blob");

    const path = `${audit.id.replace(/^v/, "")}/auditoria.pdf`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: "application/pdf" });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const pdfUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("technical_audits")
      .update({ pdf_path: pdfUrl })
      .eq("id", audit.id);
    if (updErr) throw updErr;

    return pdfUrl;
  } finally {
    if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
  }
}

export async function backfillMissingAuditPdfs(audits: AuditLike[]): Promise<void> {
  for (const a of audits) {
    if (!a.html_path || a.pdf_path) continue;
    try {
      await generateAuditPdf(a);
    } catch (e) {
      console.warn("[audit-pdf] backfill failed for", a.id, e);
    }
  }
}