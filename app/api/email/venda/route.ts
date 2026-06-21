
// ===== app/api/email/venda/route.ts =====
// API Route — corre no servidor, nunca no browser
// O marketplace.ts chama este endpoint em vez de chamar Resend directamente

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'FunilMarket <noreply@funilmarket.co.mz>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://funilapp.vercel.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, ...data } = body;

    if (tipo === 'venda') {
      await resend.emails.send({
        from: FROM,
        to: data.criadorEmail,
        subject: `🎉 Nova venda! ${data.produtoNome} — ${Number(data.valor).toLocaleString('pt-MZ')} MT`,
        html: emailVendaHtml(data),
      });
    }

    if (tipo === 'comprador') {
      if (!data.compradorEmail) return NextResponse.json({ ok: true });
      await resend.emails.send({
        from: FROM,
        to: data.compradorEmail,
        subject: `✅ Compra confirmada — ${data.produtoNome}`,
        html: emailCompradorHtml(data),
      });
    }

    if (tipo === 'boasvindas') {
      await resend.emails.send({
        from: FROM,
        to: data.email,
        subject: '👋 Bem-vindo ao FunilMarket!',
        html: emailBoasVindasHtml(data),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────

function emailVendaHtml(data: any) {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td style="background:#E24B4A;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:13px;">FunilMarket</p>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🎉 Nova venda!</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:28px 32px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;">Olá <strong>${data.criadorNome}</strong>, acabaste de fazer uma venda!</p>
            <div style="background:#FCEBEB;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
              <p style="margin:0 0 4px;color:#A32D2D;font-size:12px;font-weight:600;text-transform:uppercase;">Produto vendido</p>
              <p style="margin:0;color:#111827;font-size:18px;font-weight:700;">${data.produtoNome}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Comprador</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#111827;font-size:13px;font-weight:600;">${data.compradorNome}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Telefone</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#111827;font-size:13px;">+258 ${data.compradorTelefone}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Método</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#111827;font-size:13px;">${data.metodoPagamento === 'mpesa' ? 'M-Pesa' : 'E-Mola'}</td></tr>
              <tr><td style="padding:12px 0;color:#6b7280;font-size:13px;">O teu ganho</td><td style="padding:12px 0;text-align:right;color:#16a34a;font-size:20px;font-weight:700;">+${Number(data.valorCriador).toFixed(2)} MT</td></tr>
            </table>
            <div style="text-align:center;">
              <a href="${APP_URL}/market/dashboard" style="display:inline-block;background:#E24B4A;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">Ver no painel →</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">FunilMarket · Parte do FunilApp · Moçambique</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailCompradorHtml(data: any) {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td style="background:#E24B4A;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">✅ Compra confirmada!</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:28px 32px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;">Olá <strong>${data.compradorNome}</strong>! A tua compra foi confirmada.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;color:#15803d;font-size:12px;font-weight:600;">Produto adquirido</p>
              <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">${data.produtoNome}</p>
              <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">${Number(data.valor).toLocaleString('pt-MZ')} MT</p>
            </div>
            <div style="text-align:center;margin-bottom:20px;">
              <a href="${data.linkDownload}" style="display:inline-block;background:#E24B4A;color:#ffffff;font-size:15px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">⬇️ Fazer download agora</a>
              <p style="margin:10px 0 0;color:#9ca3af;font-size:12px;">Link válido por 48 horas</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">FunilMarket · Moçambique</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailBoasVindasHtml(data: any) {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td style="background:#E24B4A;border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Bem-vindo ao FunilMarket! 🚀</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.8);font-size:15px;">O teu conhecimento já tem preço.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:28px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá <strong>${data.nome}</strong>! 👋</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">A tua conta foi criada com sucesso. Agora podes criar e vender os teus produtos digitais e receber pelo M-Pesa ou E-Mola.</p>
            <div style="text-align:center;">
              <a href="${APP_URL}/market/dashboard/criar" style="display:inline-block;background:#E24B4A;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">Criar primeiro produto →</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">FunilMarket · Parte do FunilApp · Moçambique</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
