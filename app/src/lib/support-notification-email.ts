/**
 * Transactional HTML for support thread notifications (light theme, ELSIAA brand colors).
 */

import type { ChatAttachment, ChatMessage } from '@/lib/chat';

/** Primary CTA; override with SUPPORT_EMAIL_CLIENT_URL. */
export function resolveSupportClientsUrl(): string {
  const u = process.env.SUPPORT_EMAIL_CLIENT_URL?.trim();
  if (u) return u;
  return 'https://elsiaa.com/portal';
}

const COL = {
  pageBg: '#f5f6f8',
  cardOuter: '#ffffff',
  border: '#e4e4e7',
  muted: '#71717a',
  text: '#18181b',
  secondary: '#f4f4f5',
  secondaryHeader: '#e4e4e7',
  flame: '#1e6b3c',
  flameTint: 'rgba(30, 107, 60, 0.1)',
  flameBorder: 'rgba(30, 107, 60, 0.45)',
  flameHeader: 'rgba(30, 107, 60, 0.14)',
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime: string): boolean {
  return (mime || '').startsWith('image/');
}

function isPdfMime(mime: string, filename: string): boolean {
  const m = (mime || '').toLowerCase();
  if (m === 'application/pdf' || m.includes('pdf')) return true;
  return filename.toLowerCase().endsWith('.pdf');
}

function formatWhen(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

/** Public label consistent with support-desk `supportSenderLabel` (no session = show author). */
function authorLabel(msg: ChatMessage): string {
  const n = (msg.userName || '').trim();
  if (n === 'Vercatryx') return 'Admin';
  return n || 'User';
}

function splitAttachments(attachments: ChatAttachment[]) {
  const images = attachments.filter(
    (a) => a.type === 'image' || isImageMime(a.mimeType || '')
  );
  const pdfs = attachments.filter(
    (a) => !images.includes(a) && isPdfMime(a.mimeType || '', a.filename)
  );
  const others = attachments.filter((a) => !images.includes(a) && !pdfs.includes(a));
  return { images, pdfs, others };
}

function renderAttachments(atts: ChatAttachment[]): string {
  if (!atts.length) return '';
  const { images, pdfs, others } = splitAttachments(atts);
  const blocks: string[] = [];

  if (images.length) {
    blocks.push(
      `<p style="margin:16px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${COL.muted};">Images</p>`
    );
    for (const att of images) {
      blocks.push(
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;"><tr><td>` +
          `<a href="${esc(att.url)}" target="_blank" rel="noopener noreferrer" style="display:block;border-radius:12px;border:1px solid ${COL.border};overflow:hidden;background:${COL.secondary};text-decoration:none;">` +
          `<img src="${esc(att.url)}" alt="${esc(att.filename)}" width="504" style="display:block;width:100%;max-width:504px;height:auto;border:0;background:${COL.secondary};" />` +
          `<div style="padding:10px 12px;border-top:1px solid ${COL.border};background:#fafafa;font-size:12px;color:${COL.text};">` +
          `<span style="display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;">${esc(att.filename)}</span>` +
          `<span style="color:${COL.muted};font-size:11px;">${esc(formatFileSize(att.size))}</span>` +
          `</div></a></td></tr></table>`
      );
    }
  }

  if (pdfs.length) {
    blocks.push(
      `<p style="margin:16px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${COL.muted};">Documents</p>`
    );
    for (const att of pdfs) {
      blocks.push(
        `<div style="margin-bottom:12px;border-radius:12px;border:1px solid ${COL.border};background:${COL.secondary};overflow:hidden;">` +
          `<div style="padding:36px 16px;text-align:center;background:${COL.secondaryHeader};color:${COL.muted};font-size:13px;font-weight:600;">PDF preview</div>` +
          `<div style="padding:12px 14px;border-top:1px solid ${COL.border};display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;">` +
          `<span style="color:${COL.text};font-weight:600;overflow:hidden;text-overflow:ellipsis;">${esc(att.filename)}</span>` +
          `<a href="${esc(att.url)}" target="_blank" rel="noopener noreferrer" style="flex-shrink:0;color:${COL.flame};font-weight:600;text-decoration:none;">Open</a>` +
          `</div></div>`
      );
    }
  }

  if (others.length) {
    blocks.push(
      `<p style="margin:16px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${COL.muted};">Files</p>`
    );
    for (const att of others) {
      const isVoice = att.type === 'voice';
      blocks.push(
        `<div style="margin-bottom:12px;border-radius:12px;border:1px solid ${COL.border};background:${COL.secondary};padding:16px;">` +
          `<div style="display:flex;gap:12px;align-items:flex-start;">` +
          `<div style="width:56px;height:56px;border-radius:10px;background:${COL.secondaryHeader};flex-shrink:0;"></div>` +
          `<div style="min-width:0;flex:1;">` +
          `<p style="margin:0;font-weight:600;color:${COL.text};font-size:14px;word-break:break-word;">${esc(isVoice ? att.filename || 'Voice note' : att.filename)}</p>` +
          `<p style="margin:6px 0 0;font-size:12px;color:${COL.muted};">${esc(formatFileSize(att.size))}</p>` +
          `<p style="margin:12px 0 0;">` +
          `<a href="${esc(att.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 14px;border-radius:8px;background:rgba(30,107,60,0.12);color:${COL.flame};font-size:12px;font-weight:600;text-decoration:none;">${isVoice ? 'Listen' : 'Download'}</a>` +
          `</p></div></div></div>`
      );
    }
  }

  return blocks.join('');
}

function renderMessageCard(msg: ChatMessage, opts: { highlight: boolean }): string {
  const headBg = opts.highlight ? COL.flameHeader : COL.secondaryHeader;
  const headBorder = opts.highlight ? COL.flameBorder : COL.border;
  const outerBorder = opts.highlight ? COL.flameBorder : COL.border;
  const outerBg = opts.highlight ? COL.flameTint : COL.secondary;

  const body =
    (msg.message?.trim()
      ? `<p style="margin:0;white-space:pre-wrap;font-size:15px;line-height:1.65;color:${COL.text};">${esc(msg.message)}</p>`
      : msg.attachments?.length
        ? ''
        : `<p style="margin:0;font-size:14px;font-style:italic;color:${COL.muted};">(No message text)</p>`) +
    renderAttachments(msg.attachments || []);

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">` +
    `<tr><td style="border-radius:14px;border:1px solid ${outerBorder};background:${outerBg};overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">` +
    `<div style="padding:14px 18px;border-bottom:1px solid ${headBorder};background:${headBg};display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline;">` +
    `<span style="font-weight:700;font-size:15px;color:${COL.text};">${esc(authorLabel(msg))}</span>` +
    `<span style="font-size:12px;color:${COL.muted};">${esc(formatWhen(msg.timestamp))}</span>` +
    `</div>` +
    `<div style="padding:18px 18px 20px;">${body}</div>` +
    `</td></tr></table>`
  );
}

export function sliceHistoryForNotify(
  allMessages: ChatMessage[],
  trigger: ChatMessage
): { prior: ChatMessage[]; newest: ChatMessage } {
  const sorted = [...allMessages].sort((a, b) => {
    const dt = a.timestamp - b.timestamp;
    if (dt !== 0) return dt;
    return a.id.localeCompare(b.id);
  });
  const idx = sorted.findIndex((m) => m.id === trigger.id);
  if (idx === -1) {
    const without = sorted.filter((m) => m.id !== trigger.id);
    return {
      prior: without.slice(-5),
      newest: trigger,
    };
  }
  const prior = sorted.slice(Math.max(0, idx - 5), idx);
  return { prior, newest: sorted[idx] };
}

export type SupportNotificationEmailInput = {
  companyName: string;
  threadTitle: string;
  priorMessages: ChatMessage[];
  newMessage: ChatMessage;
};

export function buildSupportNotificationPlainText(input: SupportNotificationEmailInput): string {
  const lines: string[] = [];
  lines.push(`You have a new message on ${input.companyName}: ${input.threadTitle}`);
  lines.push('');
  lines.push(`From ${authorLabel(input.newMessage)} · ${formatWhen(input.newMessage.timestamp)}`);
  if (input.newMessage.message?.trim()) lines.push(input.newMessage.message);
  if (input.priorMessages.length) {
    lines.push('');
    lines.push('Recent messages:');
    for (const m of input.priorMessages) {
      lines.push(`— ${authorLabel(m)} (${formatWhen(m.timestamp)}): ${m.message?.trim() || '(attachment)'}`);
    }
  }
  lines.push('');
  lines.push(`Go to the ELSIAA portal: ${resolveSupportClientsUrl()}`);
  return lines.join('\n');
}

export function buildSupportNotificationHtml(input: SupportNotificationEmailInput): string {
  const clientsUrl = resolveSupportClientsUrl();
  const headline = `You have a new message on <strong style="color:${COL.text};">${esc(input.companyName)}</strong>`;
  const sub = `${esc(input.threadTitle)}`;

  const priorBlocks =
    input.priorMessages.length > 0
      ? `<p style="margin:24px 0 12px;font-size:13px;font-weight:600;color:${COL.muted};letter-spacing:0.02em;">Recent messages</p>` +
        input.priorMessages.map((m) => renderMessageCard(m, { highlight: false })).join('')
      : '';

  const newBlock =
    `<p style="margin:28px 0 12px;font-size:13px;font-weight:600;color:${COL.flame};letter-spacing:0.04em;">New message</p>` +
    renderMessageCard(input.newMessage, { highlight: true });

  const cta = `<a href="${esc(clientsUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;border-radius:10px;background:${COL.flame};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;box-shadow:0 4px 14px rgba(30,107,60,0.28);">Go to the ELSIAA portal</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta http-equiv="x-ua-compatible" content="ie=edge"/></head>
<body style="margin:0;padding:0;background:${COL.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${COL.pageBg};padding:28px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;border-radius:16px;border:1px solid ${COL.border};background:${COL.cardOuter};overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
<tr><td style="padding:28px 28px 20px;">
<p style="margin:0 0 12px;font-size:18px;line-height:1.35;color:${COL.text};">${headline}</p>
<p style="margin:0 0 8px;font-size:15px;line-height:1.45;color:${COL.muted};">${sub}</p>
<p style="margin:16px 0 0;font-size:13px;color:${COL.muted};">From <strong style="color:${COL.text};">${esc(authorLabel(input.newMessage))}</strong> · ${esc(formatWhen(input.newMessage.timestamp))}</p>
</td></tr>
<tr><td style="padding:0 24px 24px;">
<div style="height:1px;background:${COL.border};margin:0 0 20px;"></div>
${priorBlocks}
${newBlock}
<div style="text-align:center;padding:12px 0 8px;">
${cta}
</div>
<p style="margin:16px 0 0;text-align:center;font-size:12px;color:${COL.muted};">Opens ${esc(clientsUrl)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
