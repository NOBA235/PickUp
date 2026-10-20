/**
 * Deterministic Card Builder (Rule-Based Extractor)
 *
 * Extracts three key recovery cues from raw note text:
 * 1. whereIWas: Context of what the user was doing
 * 2. nextAction: A concrete, bite-sized step doable in ~5 minutes
 * 3. waitingOn: External blocker or dependency (optional)
 *
 * Principles:
 * - 100% deterministic, rule-based heuristics
 * - Never claims to "understand" or "comprehend" text
 * - Resilient against empty inputs, run-ons, long text, and non-English scripts
 * - Never crashes
 */

export interface ExtractedCues {
  whereIWas: string;
  nextAction: string;
  waitingOn: string;
  source: 'rules';
}

const DEFAULT_NEXT_ACTION = 'Spend 5 minutes re-reading your last notes and outline the next small step.';
const DEFAULT_WHERE_I_WAS = 'Work in progress';

/**
 * Clean up text by removing leading cue phrases, extra spaces, and trailing punctuation.
 */
function cleanSegment(text: string): string {
  if (!text) return '';
  return text
    .replace(/^[:\s,\-–—]+/, '')
    .replace(/[:\s,\-–—]+$/, '')
    .trim();
}

/**
 * Capitalize first character of text.
 */
function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Truncates text gently at a word boundary if it exceeds maxChars.
 */
function truncateText(text: string, maxChars: number = 240): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 50 ? cut.slice(0, lastSpace) : cut).trim() + '...';
}

/**
 * Extracts sentences or major clauses from text.
 */
function splitClauses(text: string): string[] {
  if (!text) return [];
  // Split on newlines, periods, question marks, exclamation marks, semicolons, or bullet points
  const rawSegments = text.split(/[\r\n]+|[.!?;\u3002\uFF01\uFF1F]+|\s+[-*•]\s+/);
  return rawSegments.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Deterministically extracts Where I Was, Next 5-Minute Action, and Waiting On from raw text.
 */
export function extractCardCues(rawText: string): ExtractedCues {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      whereIWas: DEFAULT_WHERE_I_WAS,
      nextAction: DEFAULT_NEXT_ACTION,
      waitingOn: '',
      source: 'rules',
    };
  }

  const normalized = rawText.trim();
  const clauses = splitClauses(normalized);

  let whereIWas = '';
  let nextAction = '';
  let waitingOn = '';

  // 1. Look for "waiting for" / "waiting on" / "blocked by" cues
  const waitingRegex = /(?:waiting\s+(?:on|for)|blocked\s+by|pending|need\s+(?:reply|approval|response)\s+from)\s+([^.?!;\n]+)/i;
  const waitingMatch = normalized.match(waitingRegex);
  if (waitingMatch && waitingMatch[1]) {
    waitingOn = cleanSegment(waitingMatch[1]);
  }

  // 2. Look for "next" / "need to" / "stuck on" / "todo" cues for nextAction
  const nextCuesRegex = /(?:next(?:\s+(?:step\s+is|step:|step|up|is))?|next:|stuck\s+on|need\s+to|need|have\s+to|todo:?|plan\s+to)\s+([^.?!;\n]+)/i;
  const nextMatch = normalized.match(nextCuesRegex);

  if (nextMatch && nextMatch[0]) {
    const matchedPrefix = nextMatch[0].toLowerCase();
    const extractedContent = cleanSegment(nextMatch[1]);

    if (matchedPrefix.includes('stuck on')) {
      nextAction = `Investigate for 5 minutes: ${extractedContent}`;
    } else if (extractedContent) {
      nextAction = capitalize(extractedContent);
    }
  }

  // 3. Look for "where I was" cues
  const whereCuesRegex = /(?:was\s+(?:doing|working\s+on|reading|writing|debugging|in\s+the\s+middle\s+of)|working\s+on|finished|completed|reading|writing)\s+([^.?!;\n]+)/i;
  const whereMatch = normalized.match(whereCuesRegex);

  if (whereMatch && whereMatch[1]) {
    const extracted = cleanSegment(whereMatch[1]);
    const fullMatch = whereMatch[0].trim();
    if (fullMatch.toLowerCase().startsWith('finished')) {
      whereIWas = `Finished: ${extracted}`;
    } else {
      whereIWas = capitalize(extracted);
    }
  }

  // 4. Fallbacks when specific cues are not found
  if (!whereIWas) {
    if (clauses.length > 0) {
      whereIWas = capitalize(cleanSegment(clauses[0]));
    } else {
      whereIWas = DEFAULT_WHERE_I_WAS;
    }
  }

  if (!nextAction) {
    // If there is a second clause/sentence and it wasn't used for whereIWas or waitingOn, check it
    if (clauses.length > 1 && clauses[1] !== whereIWas && !clauses[1].includes(waitingOn)) {
      const candidate = cleanSegment(clauses[1]);
      if (candidate.length > 0 && candidate.length < 120) {
        nextAction = `Take 5 minutes to: ${candidate}`;
      } else {
        nextAction = DEFAULT_NEXT_ACTION;
      }
    } else {
      nextAction = DEFAULT_NEXT_ACTION;
    }
  }

  // Ensure nextAction reads as a 5-minute action
  if (!nextAction.toLowerCase().includes('5 minute') && !nextAction.toLowerCase().includes('5-minute')) {
    // If short and concrete, prefix with a 5-minute prompt framing
    if (nextAction.length < 60 && !nextAction.toLowerCase().startsWith('take') && !nextAction.toLowerCase().startsWith('spend')) {
      nextAction = `Spend 5 minutes to ${nextAction.charAt(0).toLowerCase() + nextAction.slice(1)}`;
    }
  }

  return {
    whereIWas: truncateText(whereIWas, 200),
    nextAction: truncateText(nextAction, 200),
    waitingOn: truncateText(waitingOn, 150),
    source: 'rules',
  };
}
