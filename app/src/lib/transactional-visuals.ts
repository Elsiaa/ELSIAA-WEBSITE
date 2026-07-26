/**
 * Inline SVGs and pdfmake snippets for emails/PDFs (no emoji, no remote assets).
 */

/** White check on green buttons / badges (email-safe). */
export const emailSvgCheckWhite16 =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;display:inline-block;flex-shrink:0"><path d="M20 6 9 17l-5-5"/></svg>';

/** White X on dark/neutral buttons (email-safe). */
export const emailSvgXWhite16 =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;display:inline-block;flex-shrink:0"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

/** Green check for body copy on light backgrounds. */
export const emailSvgCheckGreen16 =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;display:inline-block;margin-right:6px"><path d="M20 6 9 17l-5-5"/></svg>';

/** Accent alert icon for urgent email headers (stroke matches brand red). */
export const emailSvgAlertAccent20 =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;display:inline-block;flex-shrink:0"><path d="M12 16h.01"/><path d="M12 8v4"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>';

/** Centered row: drawn check + label for pdfmake receipts. */
export function pdfMakePaymentSuccessRow(successBadgeStyleKey: string) {
  return {
    columnGap: 8,
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        stack: [
          {
            canvas: [
              { type: 'line', x1: 2, y1: 10, x2: 6, y2: 14, lineWidth: 2.4, lineColor: '#4CAF50' },
              { type: 'line', x1: 6, y1: 14, x2: 14, y2: 6, lineWidth: 2.4, lineColor: '#4CAF50' },
            ],
          },
        ],
        margin: [0, 2, 0, 0],
      },
      { width: 'auto', text: 'Payment successful', style: successBadgeStyleKey, margin: [0, 0, 0, 0] },
      { width: '*', text: '' },
    ],
    margin: [0, 0, 0, 30],
  };
}
