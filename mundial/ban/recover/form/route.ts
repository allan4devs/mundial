// app/api/mundial/ban/recover/form/route.ts
// Returns a printable HTML appeal form. Opens in a new tab; user prints to PDF, fills, signs, uploads.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ticketId = (req.nextUrl.searchParams.get("ticketId") ?? "").slice(0, 40);
  const playerName = (req.nextUrl.searchParams.get("playerName") ?? "").slice(0, 80);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Formulario de Apelación — Quiniela Mundial 2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #111;
      background: #fff;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 25mm;
    }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 24px; }
    .header h1 { font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .header .sub { font-size: 10pt; color: #555; margin-top: 4px; }
    .header .meta { display: flex; justify-content: space-between; margin-top: 12px; font-size: 10pt; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 10pt; font-weight: bold; margin-bottom: 3px; }
    .field .line {
      border-bottom: 1px solid #333;
      min-height: 20px;
      width: 100%;
      display: block;
    }
    .field .area {
      border: 1px solid #333;
      min-height: 80px;
      width: 100%;
      display: block;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .signature-section { margin-top: 30px; }
    .signature-box {
      border: 1px solid #333;
      height: 90px;
      width: 240px;
      display: block;
    }
    .declaration {
      border: 1px solid #333;
      background: #f9f9f9;
      padding: 12px;
      font-size: 9.5pt;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .footer { margin-top: 32px; font-size: 8.5pt; color: #777; border-top: 1px solid #ccc; padding-top: 10px; }
    @media print {
      body { padding: 15mm 20mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#fef9c3;border:1px solid #f0b429;padding:10px 16px;margin-bottom:20px;font-family:system-ui,sans-serif;font-size:13px;border-radius:8px">
    <strong>Instrucciones:</strong> Imprime este formulario (Ctrl+P), complétalo a mano con bolígrafo, fírmalo, y sube una foto clara en el proceso de recuperación de cuenta.
    <button onclick="window.print()" style="margin-left:16px;background:#1a1a1a;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px">Imprimir</button>
  </div>

  <div class="header">
    <h1>Formulario Oficial de Apelación</h1>
    <p class="sub">Quiniela Mundial 2026 &mdash; La Vieja Adventures</p>
    <div class="meta">
      <span>Ticket: <strong>${ticketId || "____________"}</strong></span>
      <span>Fecha de firma: ___________________</span>
    </div>
  </div>

  <div class="section">
    <h2>1. Datos del participante</h2>
    <div class="grid-2">
      <div class="field">
        <label>Nombre completo</label>
        <div class="line"></div>
      </div>
      <div class="field">
        <label>Cédula o pasaporte</label>
        <div class="line"></div>
      </div>
    </div>
    <div class="field">
      <label>Nombre en la quiniela</label>
      <div class="line" style="width:50%">${playerName || ""}</div>
    </div>
    <div class="grid-2">
      <div class="field">
        <label>Correo electrónico</label>
        <div class="line"></div>
      </div>
      <div class="field">
        <label>Teléfono de contacto</label>
        <div class="line"></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>2. Motivo de la apelación</h2>
    <p style="font-size:10pt;margin-bottom:8px;">Explique detalladamente por qué considera que la suspensión fue aplicada por error o injustamente:</p>
    <div class="field">
      <div class="area"></div>
    </div>
    <div class="field">
      <div class="area" style="min-height:50px"></div>
    </div>
  </div>

  <div class="section">
    <h2>3. Compromisos del participante</h2>
    <div style="font-size:10pt;margin-bottom:8px">
      <p style="margin-bottom:6px">Marque cada casilla que acepta:</p>
      <p>☐ &nbsp;Acepto las reglas y términos de la Quiniela Mundial 2026.</p>
      <p style="margin-top:5px">☐ &nbsp;Me comprometo a no cometer infracciones en el futuro.</p>
      <p style="margin-top:5px">☐ &nbsp;Entiendo que una nueva infracción resultará en suspensión permanente.</p>
      <p style="margin-top:5px">☐ &nbsp;Autorizo la verificación de mi identidad mediante los métodos indicados.</p>
    </div>
  </div>

  <div class="declaration">
    <strong>DECLARACIÓN JURADA:</strong> Yo, el abajo firmante, declaro bajo juramento que toda la información proporcionada en este formulario es verdadera, completa y actualizada. Entiendo que proporcionar información falsa resultará en el rechazo inmediato de la apelación y en la suspensión permanente de mi cuenta.
  </div>

  <div class="signature-section">
    <p style="font-size:10pt;margin-bottom:6px;font-weight:bold">Firma del participante:</p>
    <div class="signature-box"></div>
    <p style="font-size:9.5pt;margin-top:6px">Nombre legible: _________________________________ &nbsp;&nbsp; Fecha: _________________</p>
  </div>

  <div class="footer">
    Este formulario es parte del proceso oficial de recuperación de cuenta de La Vieja Adventures. Número de referencia: ${ticketId || "N/A"}. Conserve una copia para sus registros.
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
