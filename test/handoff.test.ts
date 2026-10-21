import { describe, it, expect } from 'vitest';
import {
  encodeCardForUrl,
  decodeCardFromHash,
  formatPlainTextCard,
  generateShareUrl,
  MAX_HASH_PAYLOAD_BYTES,
} from '../src/lib/handoff';
import { createCard } from '../src/model/card';

function toBase64String(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return (globalThis as any).Buffer.from(str, 'utf-8').toString('base64');
}

describe('Handoff & Sharing Module (Phase 5)', () => {
  describe('Encode / Decode Round Trip', () => {
    it('successfully encodes and decodes a card with all cues', () => {
      const card = createCard({
        whereIWas: 'Debugging webpack build error on line 42',
        nextAction: 'Spend 5 minutes verifying tsconfig alias',
        waitingOn: 'Code review from Sarah',
        rawText: 'Original voice transcript notes',
      });

      const encodedHash = encodeCardForUrl(card);
      expect(typeof encodedHash).toBe('string');
      expect(encodedHash.length).toBeGreaterThan(0);

      const decoded = decodeCardFromHash(encodedHash);
      expect(decoded).not.toBeNull();
      expect(decoded?.whereIWas).toBe('Debugging webpack build error on line 42');
      expect(decoded?.nextAction).toBe('Spend 5 minutes verifying tsconfig alias');
      expect(decoded?.waitingOn).toBe('Code review from Sarah');
      expect(decoded?.rawText).toBe('Original voice transcript notes');
    });

    it('works when passed a full hash with leading # and handoff= prefix', () => {
      const card = createCard({
        whereIWas: 'Drafting thesis chapter 1',
        nextAction: 'Review citations',
      });

      const url = generateShareUrl(card, 'https://pickup.app/');
      expect(url).toContain('https://pickup.app/#handoff=');

      const hashWithPrefix = url.slice(url.indexOf('#'));
      const decoded = decodeCardFromHash(hashWithPrefix);

      expect(decoded).not.toBeNull();
      expect(decoded?.whereIWas).toBe('Drafting thesis chapter 1');
      expect(decoded?.nextAction).toBe('Review citations');
    });
  });

  describe('Malformed Hash Handling', () => {
    it('returns null for empty or null hash', () => {
      expect(decodeCardFromHash('')).toBeNull();
      expect(decodeCardFromHash(null as any)).toBeNull();
      expect(decodeCardFromHash('#')).toBeNull();
      expect(decodeCardFromHash('#handoff=')).toBeNull();
    });

    it('returns null for corrupted base64 input', () => {
      expect(decodeCardFromHash('!!!not_valid_base64$$$')).toBeNull();
    });

    it('returns null for valid base64 with invalid JSON content', () => {
      const invalidJsonBase64 = toBase64String('{ unclosed json: [');
      expect(decodeCardFromHash(invalidJsonBase64)).toBeNull();
    });

    it('returns null for non-object JSON payloads (arrays, primitives)', () => {
      const arrayBase64 = toBase64String(JSON.stringify(['array', 'not', 'object']));
      expect(decodeCardFromHash(arrayBase64)).toBeNull();

      const numberBase64 = toBase64String(JSON.stringify(12345));
      expect(decodeCardFromHash(numberBase64)).toBeNull();
    });
  });

  describe('Oversized Hash Enforcement', () => {
    it('strictly rejects payloads exceeding 2048 bytes', () => {
      // Create a payload larger than 2048 bytes
      const oversizedText = 'A'.repeat(MAX_HASH_PAYLOAD_BYTES + 100);
      expect(decodeCardFromHash(oversizedText)).toBeNull();

      const hugePayload = {
        whereIWas: 'X'.repeat(3000),
        nextAction: 'Y'.repeat(3000),
      };
      const oversizedJson = toBase64String(JSON.stringify(hugePayload));
      expect(decodeCardFromHash(oversizedJson)).toBeNull();
    });
  });

  describe('XSS & Untrusted Payload Safety', () => {
    it('safely handles script tags and HTML injection without execution or mutation', () => {
      const maliciousPayload = {
        whereIWas: '<script>alert("XSS")</script> Working on auth flow',
        nextAction: '<img src=x onerror="alert(1)"> Check login page',
        waitingOn: '<svg onload=alert(document.cookie)>',
        rawText: 'javascript:alert(1)',
      };

      const encoded = encodeCardForUrl(maliciousPayload as any);
      const decoded = decodeCardFromHash(encoded);

      expect(decoded).not.toBeNull();
      // Verifies that decoded content remains raw text strings (to be rendered via textContent only)
      expect(decoded?.whereIWas).toContain('<script>alert("XSS")</script>');
      expect(decoded?.nextAction).toContain('<img src=x onerror="alert(1)">');
      expect(decoded?.waitingOn).toContain('<svg onload=alert(document.cookie)>');

      // Verify that assigning to textContent does not create HTML nodes
      const mockElement = {
        textContent: '',
      };
      mockElement.textContent = decoded!.whereIWas;
      expect(mockElement.textContent).toBe('<script>alert("XSS")</script> Working on auth flow');
    });
  });

  describe('Plain-Text Template Formatting', () => {
    it('formats a complete plain-text template with bullets and emoji', () => {
      const formatted = formatPlainTextCard({
        whereIWas: 'Reading biology textbook page 84',
        nextAction: 'Summarize cellular respiration',
        waitingOn: 'Study partner feedback',
      });

      expect(formatted).toContain('📌 PickUp Card:');
      expect(formatted).toContain('• Where I was: Reading biology textbook page 84');
      expect(formatted).toContain('• Next 5-min action: Summarize cellular respiration');
      expect(formatted).toContain('• Waiting on: Study partner feedback');
    });

    it('omits waiting on line when not present', () => {
      const formatted = formatPlainTextCard({
        whereIWas: 'Writing report',
        nextAction: 'Draft conclusion',
      });

      expect(formatted).toContain('• Where I was: Writing report');
      expect(formatted).toContain('• Next 5-min action: Draft conclusion');
      expect(formatted).not.toContain('Waiting on');
    });
  });
});
