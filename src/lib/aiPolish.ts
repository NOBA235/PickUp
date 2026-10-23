/**
 * Client-Side AI Polish Service (Phase 8)
 * Coordinates requests to the serverless /api/polish endpoint.
 *
 * Invariants:
 * - 8-second client-side timeout protection
 * - On ANY failure (network, timeout, 429, 500, invalid JSON), silently keeps rule-based card
 * - Sets source to 'rules' on failure ("Made without AI") or 'ai' on success ("Polished with AI")
 */

import { ExtractedCues } from './cardBuilder';

export interface PolishResult {
  cues: ExtractedCues;
  source: 'ai' | 'rules';
  error?: string;
}

/**
 * Validates untrusted response schema from the polish endpoint.
 */
function isValidPolishedCues(data: unknown): data is ExtractedCues {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  return (
    typeof obj.whereIWas === 'string' &&
    obj.whereIWas.trim().length > 0 &&
    typeof obj.nextAction === 'string' &&
    obj.nextAction.trim().length > 0 &&
    (obj.waitingOn === undefined || typeof obj.waitingOn === 'string')
  );
}

/**
 * Requests an AI polish of the rule-based card.
 * Enforces an 8-second timeout and guarantees graceful fallback to rule-based cues.
 */
export async function polishCardWithAI(
  rawText: string,
  ruleCard: ExtractedCues,
  endpoint = '/api/polish'
): Promise<PolishResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawText,
        ruleCard,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[PickUp:AIPolish] Endpoint returned HTTP ${response.status}. Falling back to rule-based card.`
      );
      return {
        cues: { ...ruleCard },
        source: 'rules',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (!isValidPolishedCues(data)) {
      console.warn(
        '[PickUp:AIPolish] Response payload failed schema validation. Falling back to rule-based card.'
      );
      return {
        cues: { ...ruleCard },
        source: 'rules',
        error: 'Invalid schema',
      };
    }

    return {
      cues: {
        whereIWas: data.whereIWas.trim(),
        nextAction: data.nextAction.trim(),
        waitingOn: data.waitingOn ? data.waitingOn.trim() : '',
      },
      source: 'ai',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === 'AbortError';

    if (isTimeout) {
      console.warn('[PickUp:AIPolish] Request exceeded 8s timeout. Falling back to rule-based card.');
    } else {
      console.warn('[PickUp:AIPolish] Fetch error. Falling back to rule-based card:', err?.message || err);
    }

    return {
      cues: { ...ruleCard },
      source: 'rules',
      error: isTimeout ? 'Timeout' : err?.message || 'Network error',
    };
  }
}
