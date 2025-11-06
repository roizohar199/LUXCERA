/**
 * Security utilities and helpers
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Note: For emails, we use escapeHtml instead for simplicity and security
 * If you need full HTML sanitization, consider using a dedicated library
 */
export function sanitizeHtml(html: string): string {
  // For email purposes, we just escape HTML to be safe
  // If you need to allow certain HTML tags, consider using dompurify with jsdom
  return escapeHtml(html);
}

/**
 * Sanitizes user input for safe display in HTML emails
 */
export function sanitizeForEmail(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // First escape HTML, then allow sanitized HTML tags if needed
  return escapeHtml(stringValue);
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if it has 9-15 digits
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
}

/**
 * Sanitizes and validates string input
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove null bytes and trim
  let sanitized = input.replace(/\0/g, '').trim();
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

