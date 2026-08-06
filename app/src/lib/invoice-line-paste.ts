/**
 * Parses billing paste format: repeated triplets
 * `description;; qty;; unitPrice;;` (trailing/leading `;;` is OK).
 */
export type DraftInvoiceLinePaste = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export function parseDoubleSemicolonInvoiceLines(
  raw: string,
): { ok: true; lines: DraftInvoiceLinePaste[] } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) {
    return { ok: false, error: "Paste your lines first." };
  }
  if (!text.includes(";;")) {
    return {
      ok: false,
      error:
        "Use double semicolons between fields, e.g. Implementation hours;; 1;; 100;; Support;; 2;; 50;;",
    };
  }
  let parts = text.split(";;").map((p) => p.trim());
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  while (parts.length && parts[0] === "") parts.shift();
  if (parts.length === 0) {
    return { ok: false, error: "No line data found." };
  }
  if (parts.length % 3 !== 0) {
    return {
      ok: false,
      error: `Incomplete rows: ${parts.length} values (need groups of 3: description, qty, unit price).`,
    };
  }
  const lines: DraftInvoiceLinePaste[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    const description = parts[i];
    const quantity = parts[i + 1];
    const unitPrice = parts[i + 2];
    const rowNum = lines.length + 1;
    if (!description) {
      return { ok: false, error: `Row ${rowNum}: missing description.` };
    }
    const q = parseFloat(quantity);
    const u = parseFloat(unitPrice);
    if (!Number.isFinite(q) || q <= 0) {
      return {
        ok: false,
        error: `Row ${rowNum}: quantity must be a number greater than zero (got "${quantity}").`,
      };
    }
    if (!Number.isFinite(u) || u < 0) {
      return {
        ok: false,
        error: `Row ${rowNum}: unit price must be a number ≥ 0 (got "${unitPrice}").`,
      };
    }
    lines.push({
      id: crypto.randomUUID(),
      description,
      quantity,
      unitPrice,
    });
  }
  return { ok: true, lines };
}
