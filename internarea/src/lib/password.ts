const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generatePassword(length = 10): string {
  const safeLength = Math.max(4, Math.min(64, length));
  const bytes = crypto.getRandomValues(new Uint8Array(safeLength));
  let password = "";
  for (let i = 0; i < safeLength; i++) {
    password += LETTERS[bytes[i] % LETTERS.length];
  }
  return password;
}