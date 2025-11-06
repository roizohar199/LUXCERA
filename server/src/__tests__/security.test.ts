/**
 * Security utilities tests
 */

import { escapeHtml, sanitizeString, isValidEmail, isValidPhone } from '../security.js';

describe('Security Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('Hello & World')).toBe('Hello &amp; World');
      expect(escapeHtml("It's a test")).toBe('It&#039;s a test');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('sanitizeString', () => {
    it('should trim and limit string length', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeString(longString, 100);
      expect(result.length).toBe(100);
    });

    it('should remove null bytes', () => {
      const withNull = 'test\u0000string';
      expect(sanitizeString(withNull)).toBe('teststring');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
      expect(sanitizeString(123 as any)).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('0501234567')).toBe(true);
      expect(isValidPhone('+972501234567')).toBe(true);
      expect(isValidPhone('050-123-4567')).toBe(true); // Will extract digits
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('12345')).toBe(false); // Too short
      expect(isValidPhone('1234567890123456')).toBe(false); // Too long
    });
  });
});
