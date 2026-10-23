import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { polishCardWithAI } from '../src/lib/aiPolish';
import { checkRateLimit, resetRateLimitsForTesting, validatePolishedSchema } from '../api/polish';
import { ExtractedCues } from '../src/lib/cardBuilder';

describe('AI Polish Service & Endpoint (Phase 8)', () => {
  const sampleRuleCues: ExtractedCues = {
    whereIWas: 'Reading chapter 4 on page 82 of neuroscience text',
    nextAction: 'Write 3 bullet points on synaptic plasticity',
    waitingOn: 'Email from professor',
  };

  const rawText = 'I was reading chapter 4 page 82. Next step is writing 3 bullets on synaptic plasticity. Waiting on email from prof.';

  beforeEach(() => {
    resetRateLimitsForTesting();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Client polishCardWithAI service', () => {
    it('returns polished cues and marks source as "ai" on successful response', async () => {
      const mockPolishedResponse = {
        whereIWas: 'Reviewing neuroscience chapter 4 (page 82)',
        nextAction: 'Draft 3 summary bullets on synaptic plasticity',
        waitingOn: 'Professor email reply',
        source: 'ai',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPolishedResponse,
      } as any);

      const result = await polishCardWithAI(rawText, sampleRuleCues);

      expect(result.source).toBe('ai');
      expect(result.cues.whereIWas).toBe('Reviewing neuroscience chapter 4 (page 82)');
      expect(result.cues.nextAction).toBe('Draft 3 summary bullets on synaptic plasticity');
      expect(result.cues.waitingOn).toBe('Professor email reply');
    });

    it('silently falls back to rule-based card and marks source as "rules" on timeout', async () => {
      // Mock fetch that hangs or rejects with an AbortError
      globalThis.fetch = vi.fn().mockImplementation(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const result = await polishCardWithAI(rawText, sampleRuleCues);

      expect(result.source).toBe('rules');
      expect(result.cues).toEqual(sampleRuleCues);
      expect(result.error).toBe('Timeout');
    });

    it('silently falls back to rule-based card and marks source as "rules" on invalid JSON response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON at position 0');
        },
      } as any);

      const result = await polishCardWithAI(rawText, sampleRuleCues);

      expect(result.source).toBe('rules');
      expect(result.cues).toEqual(sampleRuleCues);
    });

    it('silently falls back to rule-based card on schema violation (missing nextAction)', async () => {
      const invalidSchemaData = {
        whereIWas: 'Some context',
        // nextAction is missing
        waitingOn: '',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => invalidSchemaData,
      } as any);

      const result = await polishCardWithAI(rawText, sampleRuleCues);

      expect(result.source).toBe('rules');
      expect(result.cues).toEqual(sampleRuleCues);
      expect(result.error).toBe('Invalid schema');
    });

    it('silently falls back to rule-based card on HTTP 500 server error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      } as any);

      const result = await polishCardWithAI(rawText, sampleRuleCues);

      expect(result.source).toBe('rules');
      expect(result.cues).toEqual(sampleRuleCues);
      expect(result.error).toBe('HTTP 500');
    });

    it('silently falls back to rule-based card on HTTP 429 rate limit', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as any);

      const result = await polishCardWithAI(rawText, sampleRuleCues);

      expect(result.source).toBe('rules');
      expect(result.cues).toEqual(sampleRuleCues);
      expect(result.error).toBe('HTTP 429');
    });

    it('silently falls back to rule-based card on network disconnection', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await polishCardWithAI(rawText, sampleRuleCues);

      expect(result.source).toBe('rules');
      expect(result.cues).toEqual(sampleRuleCues);
      expect(result.error).toBe('Failed to fetch');
    });
  });

  describe('Serverless Schema Validation', () => {
    it('accepts compliant JSON response payloads', () => {
      const valid = {
        whereIWas: 'Writing report introduction',
        nextAction: 'Outline section 2.1 in 5 minutes',
        waitingOn: 'Feedback from editor',
      };
      const result = validatePolishedSchema(valid);
      expect(result).not.toBeNull();
      expect(result?.whereIWas).toBe(valid.whereIWas);
      expect(result?.nextAction).toBe(valid.nextAction);
      expect(result?.waitingOn).toBe(valid.waitingOn);
    });

    it('rejects payloads with empty or non-string fields', () => {
      expect(validatePolishedSchema(null)).toBeNull();
      expect(validatePolishedSchema({})).toBeNull();
      expect(validatePolishedSchema({ whereIWas: '', nextAction: 'Do something' })).toBeNull();
      expect(validatePolishedSchema({ whereIWas: 'Here', nextAction: '   ' })).toBeNull();
      expect(validatePolishedSchema({ whereIWas: 123, nextAction: 'Do something' })).toBeNull();
    });
  });

  describe('Serverless Rate Limiting', () => {
    it('allows up to 15 requests per window and throttles the 16th', () => {
      const testIp = '192.168.1.100';

      for (let i = 0; i < 15; i++) {
        expect(checkRateLimit(testIp)).toBe(true);
      }

      // 16th request is rejected
      expect(checkRateLimit(testIp)).toBe(false);

      // Separate IP is unaffected
      expect(checkRateLimit('192.168.1.101')).toBe(true);
    });
  });
});
