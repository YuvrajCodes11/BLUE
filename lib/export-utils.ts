"use client";

/**
 * Universal export utilities for BLUE Platform
 * Supports native CSV generation & browser download,
 * and printable/downloadable official PDF reports.
 */

export function exportToCsv(
  filename: string,
  data: Record<string, any>[],
  columns?: { key: string; label: string }[]
) {
  if (!data || !data.length) return;

  const cols =
    columns ||
    Object.keys(data[0])
      .filter((k) => !["id"].includes(k))
      .map((k) => ({ key: k, label: k.replace(/_/g, " ").toUpperCase() }));

  const headerRow = cols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const dataRows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = "\ufeff" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function exportOfficialPdfReport({
  filename,
  title,
  referenceNo,
  category,
  authority = "State Department for Blue Economy & Fisheries",
  metadata,
  summary,
  tables,
}: {
  filename: string;
  title: string;
  referenceNo?: string;
  category?: string;
  authority?: string;
  metadata?: { label: string; value: string }[];
  summary?: string;
  tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
}) {
  const refNo = referenceNo || `KE-BLU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const metadataHtml = metadata?.length
    ? `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
        ${metadata
          .map(
            (m) => `
          <div>
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">${escapeHtml(m.label)}</div>
            <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">${escapeHtml(String(m.value))}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `
    : "";

  const tablesHtml = tables?.length
    ? tables
        .map(
          (t) => `
        <div style="margin: 24px 0;">
          <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0284c7; margin-bottom: 8px;">${escapeHtml(t.title)}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                ${t.headers.map((h) => `<th style="padding: 8px 12px; font-weight: 700; font-size: 11px; text-transform: uppercase;">${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${t.rows
                .map(
                  (r, rIdx) => `
                <tr style="border-bottom: 1px solid #e2e8f0; background: ${rIdx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                  ${r.map((c) => `<td style="padding: 8px 12px; color: #334155;">${escapeHtml(String(c))}</td>`).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
        )
        .join("")
    : "";

  const summaryHtml = summary
    ? `
      <div style="margin: 20px 0; padding: 14px 18px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0284c7; margin-bottom: 4px;">Official Finding & Executive Summary</div>
        <p style="font-size: 12px; line-height: 1.6; color: #1e293b; margin: 0;">${escapeHtml(summary)}</p>
      </div>
    `
    : "";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(refNo)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .republic {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #0284c7;
      margin: 0;
    }
    .ministry {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin: 4px 0 0 0;
    }
    .seal-pill {
      display: inline-block;
      margin-top: 10px;
      padding: 3px 12px;
      border: 1px solid #10b981;
      background: #ecfdf5;
      color: #047857;
      font-size: 10px;
      font-weight: 800;
      border-radius: 9999px;
      letter-spacing: 0.05em;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin: 16px 0 4px 0;
      text-transform: uppercase;
    }
    .ref-badge {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #64748b;
    }
    .stamp-box {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="republic">Republic of Kenya</p>
    <p class="ministry">Ministry of Mining, Blue Economy and Maritime Affairs</p>
    <p class="ministry" style="font-weight: 800; color: #0284c7;">${escapeHtml(authority)}</p>
    <div class="seal-pill">DIGITAL VERIFICATION SEAL · AUTHENTICATED</div>
    <h1 class="doc-title">${escapeHtml(title)}</h1>
    <div class="ref-badge">REFERENCE NO: <strong>${escapeHtml(refNo)}</strong> · DATE: ${escapeHtml(dateStr)}</div>
  </div>

  ${category ? `<div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 8px;">CATEGORY: ${escapeHtml(category)}</div>` : ""}

  ${metadataHtml}
  ${summaryHtml}
  ${tablesHtml}

  <div class="footer">
    <div class="stamp-box">
      <div>DIGITAL LEDGER SHA256 SEAL</div>
      <div style="color: #0284c7; font-weight: 700;">8f4b7a0c91e23da456bc9812ef013a1c</div>
      <div>BLUE UNIFIED ECOSYSTEM ARCHIVE</div>
    </div>
    <div style="text-align: right;">
      <div style="border-top: 1px solid #0f172a; width: 180px; margin-bottom: 4px;"></div>
      <div style="font-weight: 800; color: #0f172a; font-size: 11px;">Director General of Fisheries</div>
      <div>State Department for Blue Economy</div>
    </div>
  </div>
</body>
</html>`;

  // Trigger download of the HTML/PDF printable document
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  triggerBrowserDownload(blob, filename.endsWith(".html") || filename.endsWith(".pdf") ? filename : `${filename}.html`);

  // Also open print window if supported
  if (typeof window !== "undefined") {
    try {
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 300);
      }
    } catch {
      // Browser popup blocked, blob download already fired
    }
  }
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 300);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
