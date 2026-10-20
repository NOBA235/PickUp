import { describe, it, expect } from 'vitest';
import { extractCardCues } from '../src/lib/cardBuilder';
import { cardExtractorFixtures } from './fixtures/cardExtractorFixtures';

describe('Card Builder - Rule-Based Extractor', () => {
  it('successfully processes all 14 test fixtures without throwing or crashing', () => {
    for (const fixture of cardExtractorFixtures) {
      expect(() => {
        const result = extractCardCues(fixture.input);

        // Core invariants for all inputs
        expect(typeof result.whereIWas).toBe('string');
        expect(result.whereIWas.length).toBeGreaterThan(0);

        expect(typeof result.nextAction).toBe('string');
        expect(result.nextAction.length).toBeGreaterThan(0);

        expect(typeof result.waitingOn).toBe('string');
        expect(result.source).toBe('rules');

        if (fixture.expectedWhereContains) {
          expect(result.whereIWas.toLowerCase()).toContain(fixture.expectedWhereContains.toLowerCase());
        }
        if (fixture.expectedNextContains) {
          expect(result.nextAction.toLowerCase()).toContain(fixture.expectedNextContains.toLowerCase());
        }
        if (fixture.expectedWaitingContains) {
          expect(result.waitingOn.toLowerCase()).toContain(fixture.expectedWaitingContains.toLowerCase());
        }
      }).not.toThrow();
    }
  });

  it('formats nextAction with a 5-minute action prompt when no explicit timing is provided', () => {
    const result = extractCardCues('Was reading paper on cognitive load. Next: review section 2.');
    expect(result.nextAction.toLowerCase()).toContain('5 minute');
  });

  it('handles extremely long text safely and bounds output lengths', () => {
    const hugeInput = 'I was debugging a complex algorithm. '.repeat(1000);
    const result = extractCardCues(hugeInput);

    expect(result.whereIWas.length).toBeLessThanOrEqual(210);
    expect(result.nextAction.length).toBeLessThanOrEqual(210);
    expect(result.waitingOn.length).toBeLessThanOrEqual(160);
  });

  it('falls back gracefully to gentle prompts on generic text with no cues', () => {
    const result = extractCardCues('Just stepped away for a quick break.');
    expect(result.whereIWas).toBe('Just stepped away for a quick break');
    expect(result.nextAction).toContain('5 minutes');
    expect(result.waitingOn).toBe('');
  });
});
