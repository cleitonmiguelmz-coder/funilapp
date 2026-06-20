// ===== lib/email.ts =====
// Envio de emails via Resend
// Instalar: npm install resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'FunilMarket <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://funilmarket.co.mz';

// ─────────────────────────────────────────────
// EMAIL DE VENDA — enviado ao criador
// ─────────────────────────────────────────────
export async function enviarEmailVenda(data: {
  criadorEmail: string;
  criadorNome: string;
  produtoNome: string;
  compradorNome: string;
  compradorTelefone: string;
  valor: number;
  valorCriador: number;
  metodoPagamento: 'mpesa' | 'emola';
  vendaId: string;
}) {
  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: data.criadorEmail,
    subject: `🎉 Nova venda! ${data.produtoNome} — ${data.valor.toLocaleString('pt-MZ')} MT`,
    html: emailVendaHtml(data),
  });

  if (error) console.error('Erro ao enviar email de venda:', error);
  return result;
}

// ─────────────────────────────────────────────
// EMAIL DE CONFIRMAÇÃO DE COMPRA — enviado ao comprador
// ─────────────────────────────────────────────
export async function enviarEmailComprador(data: {
  compradorEmail: string;
  compradorNome: string;
  produtoNome: string;
  valor: number;
  linkDownload: string;
  metodoPagamento: 'mpesa' | 'emola';
}) {
  if (!data.compradorEmail) return; // comprador pode não ter email

  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: data.compradorEmail,
    subject: `✅ Compra confirmada — ${data.produtoNome}`,
    html: emailCompradorHtml(data),
  });

  if (error) console.error('Erro ao enviar email ao comprador:', error);
  return result;
}

// ─────────────────────────────────────────────
// EMAIL DE BOAS-VINDAS — enviado ao registo
// ─────────────────────────────────────────────
export async function enviarEmailBoasVindas(data: {
  email: string;
  nome: string;
}) {
  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: '👋 Bem-vindo ao FunilMarket!',
    html: emailBoasVindasHtml(data),
  });

  if (error) console.error('Erro ao enviar email de boas-vindas:', error);
  return result;
}

// ─────────────────────────────────────────────
// TEMPLATES HTML
// ─────────────────────────────────────────────

function emailVendaHtml(data: {
  criadorNome: string;
  produtoNome: string;
  compradorNome: string;
  compradorTelefone: string;
  valor: number;
  valorCriador: number;
  metodoPagamento: 'mpesa' | 'emola';
  vendaId: string;
}) {
  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nova Venda</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#E24B4A;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:13px;">FunilMarket</p>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🎉 Nova venda!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;">
                Olá <strong>${data.criadorNome}</strong>, acabaste de fazer uma venda!
              </p>

              <!-- Produto -->
              <div style="background:#FCEBEB;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 4px;color:#A32D2D;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Produto vendido</p>
                <p style="margin:0;color:#111827;font-size:18px;font-weight:700;">${data.produtoNome}</p>
              </div>

              <!-- Detalhes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#6b7280;font-size:13px;">Comprador</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    <span style="color:#111827;font-size:13px;font-weight:600;">${data.compradorNome}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#6b7280;font-size:13px;">Telefone</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    <span style="color:#111827;font-size:13px;">+258 ${data.compradorTelefone}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#6b7280;font-size:13px;">Método</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    <span style="color:#111827;font-size:13px;">${data.metodoPagamento === 'mpesa' ? 'M-Pesa' : 'E-Mola'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#6b7280;font-size:13px;">Valor total</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    <span style="color:#111827;font-size:13px;">${data.valor.toLocaleString('pt-MZ')} MT</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#6b7280;font-size:13px;">O teu ganho</span>
                  </td>
                  <td style="padding:12px 0;text-align:right;">
                    <span style="color:#16a34a;font-size:20px;font-weight:700;">+${data.valorCriador.toFixed(2)} MT</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-top:8px;">
                <a href="${APP_URL}/market/dashboard"
                  style="display:inline-block;background:#E24B4A;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">
                  Ver no painel →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                FunilMarket · Parte do FunilApp · Moçambique<br/>
                Pagamentos via M-Pesa e E-Mola
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailCompradorHtml(data: {
  compradorNome: string;
  produtoNome: string;
  valor: number;
  linkDownload: string;
  metodoPagamento: 'mpesa' | 'emola';
}) {
  return `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td style="background:#E24B4A;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">✅ Compra confirmada!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Pagamento recebido com sucesso</p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:28px 32px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;">
                Olá <strong>${data.compradorNome}</strong>! A tua compra foi confirmada.
              </p>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#15803d;font-size:12px;font-weight:600;">Produto adquirido</p>
                <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">${data.produtoNome}</p>
                <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">${data.valor.toLocaleString('pt-MZ')} MT · ${data.metodoPagamento === 'mpesa' ? 'M-Pesa' : 'E-Mola'}</p>
              </div>

              <div style="text-align:center;margin-bottom:20px;">
                <a href="${data.linkDownload}"
                  style="display:inline-block;background:#E24B4A;color:#ffffff;font-size:15px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">
                  ⬇️ Fazer download agora
                </a>
                <p style="margin:10px 0 0;color:#9ca3af;font-size:12px;">Link válido por 48 horas</p>
              </div>

              <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;">
                <p style="margin:0;color:#92400e;font-size:12px;">
                  💡 <strong>Guarda este email</strong> — se precisares de novo acesso ao ficheiro, o link está aqui.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">FunilMarket · Moçambique</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailBoasVindasHtml(data: { nome: string }) {
  return `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td style="background:#E24B4A;border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Bem-vindo ao FunilMarket! 🚀</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.8);font-size:15px;">O teu conhecimento já tem preço.</p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:28px 32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">
                Olá <strong>${data.nome}</strong>! 👋
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                A tua conta foi criada com sucesso. Agora podes criar e vender os teus produtos digitais — ebooks, cursos, templates — e receber directamente pelo M-Pesa ou E-Mola.
              </p>

              <div style="background:#FCEBEB;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;color:#A32D2D;font-size:13px;font-weight:700;">🎯 Próximos passos:</p>
                <p style="margin:0 0 8px;color:#374151;font-size:13px;">1. Cria o teu primeiro produto</p>
                <p style="margin:0 0 8px;color:#374151;font-size:13px;">2. Define o preço e a comissão para afiliados</p>
                <p style="margin:0;color:#374151;font-size:13px;">3. Partilha o link e começa a ganhar</p>
              </div>

              <div style="text-align:center;">
                <a href="${APP_URL}/market/dashboard/criar"
                  style="display:inline-block;background:#E24B4A;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;">
                  Criar primeiro produto →
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">FunilMarket · Parte do FunilApp · Moçambique</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
