/**
 * Serverless AI Polish Endpoint (Phase 8)
 * Refines rule-based card cues into concise, actionable items.
 *
 * Constraints:
 * - Server environment variable for API key only (never exposed to client)
 * - 8-second timeout enforcement
 * - Strict JSON schema validation
 * - In-memory IP rate limiting
 * - Graceful degradation on error
 */

declare const process: any;

export interface PolishRequestBody {
  rawText: string;
  ruleCard: {
    whereIWas: string;
    nextAction: string;
    waitingOn?: string;
  };
}

export interface PolishedCardResponse {
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
  source: 'ai';
}

// In-memory sliding rate limiter per IP: max 15 requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 15;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export function resetRateLimitsForTesting(): void {
  rateLimitMap.clear();
}

/**
 * Strict schema validator for the AI response payload.
 */
export function validatePolishedSchema(data: unknown): {
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
} | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.whereIWas !== 'string' || obj.whereIWas.trim().length === 0) {
    return null;
  }

  if (typeof obj.nextAction !== 'string' || obj.nextAction.trim().length === 0) {
    return null;
  }

  let waitingOn: string | undefined = undefined;
  if (typeof obj.waitingOn === 'string' && obj.waitingOn.trim().length > 0) {
    waitingOn = obj.waitingOn.trim();
  }

  return {
    whereIWas: obj.whereIWas.trim(),
    nextAction: obj.nextAction.trim(),
    waitingOn,
  };
}

/**
 * Serverless handler compatible with both standard Request/Response and Node (req, res).
 */
export default async function handler(req: any, res?: any): Promise<Response | void> {
  const isWebStandard = typeof Request !== 'undefined' && req instanceof Request;

  const method = isWebStandard ? req.method : req.method;
  if (method !== 'POST') {
    if (isWebStandard) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Extract client IP for rate limiting
  let clientIp = '127.0.0.1';
  if (isWebStandard) {
    clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  } else {
    clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
  }

  if (!checkRateLimit(clientIp)) {
    const errorBody = { error: 'Rate limit exceeded. Maximum 15 requests per minute.' };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(429).json(errorBody);
    return;
  }

  // Parse body
  let body: PolishRequestBody;
  try {
    if (isWebStandard) {
      body = await req.json();
    } else {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch {
    const errorBody = { error: 'Invalid JSON request body' };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(400).json(errorBody);
    return;
  }

  if (!body || typeof body.rawText !== 'string' || !body.ruleCard) {
    const errorBody = { error: 'Missing required rawText or ruleCard' };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(400).json(errorBody);
    return;
  }

  // Ensure safe payload size limit (max 5,000 characters)
  if (body.rawText.length > 5000) {
    const errorBody = { error: 'Input text exceeds 5000 character maximum limit.' };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(400).json(errorBody);
    return;
  }

  // Server env var for the API key only
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const errorBody = {
      error: 'AI service API key is not configured on this server.',
      ruleCard: body.ruleCard,
    };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(503).json(errorBody);
    return;
  }

  // 8-second timeout enforcement
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const systemPrompt = `You are a calm, concise task resumption assistant for neurodivergent knowledge workers.
Given raw interrupted notes and an initial rule-based breakdown, return an improved, high-clarity 3-part card.
Rules:
1. "whereIWas": 1 concise sentence describing the exact working context.
2. "nextAction": 1 concrete micro-action starting with an active verb that takes less than 5 minutes to restart momentum.
3. "waitingOn": any external blocker, or null if none.
Return strictly valid JSON with keys "whereIWas", "nextAction", and "waitingOn". Do not include Markdown blocks.`;

    // Example call to Gemini Generative Language API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                {
                  text: `User Raw Text: "${body.rawText}"\nRule Card: ${JSON.stringify(body.ruleCard)}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI Provider HTTP error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawAiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawAiText) {
      throw new Error('AI Provider returned empty candidate parts');
    }

    const parsedJson = JSON.parse(rawAiText);
    const validated = validatePolishedSchema(parsedJson);

    if (!validated) {
      throw new Error('AI Provider response failed strict schema validation');
    }

    const result: PolishedCardResponse = {
      ...validated,
      source: 'ai',
    };

    if (isWebStandard) {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(200).json(result);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === 'AbortError';
    const status = isTimeout ? 504 : 500;
    const errorBody = {
      error: isTimeout ? 'AI Polish timed out after 8 seconds' : err.message || 'AI Polish error',
      ruleCard: body.ruleCard,
    };

    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    res.status(status).json(errorBody);
  }
}
