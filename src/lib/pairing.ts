/** Generate kode pairing 6 digit (huruf + angka, mudah dibaca). */
export function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function normalizePairingCode(input: string): string {
  return input.replace(/\s/g, "").toUpperCase().slice(0, 6);
}

export function isValidPairingCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
