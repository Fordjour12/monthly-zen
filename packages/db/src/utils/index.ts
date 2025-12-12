/**
 * Generate a random ID string
 * @param length - Length of the ID (default: 21)
 * @returns Random string ID
 */
export function generateId(length: number = 21): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Generate a nanoid-style ID
 * @returns Random string ID
 */
export function nanoid(): string {
  return generateId(21);
}