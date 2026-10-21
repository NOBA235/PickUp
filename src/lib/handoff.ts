/**
 * Card Handoff and Sharing Module (Phase 5)
 *
 * Implements three ways to pass a card:
 * 1. Plain-text template copy
 * 2. Web Share API (feature-detected)
 * 3. Serverless hash-encoded URL share link
 *
 * Security:
 * - Decoded data is treated as UNTRUSTED
 * - 2048-byte size limit enforced
 * - Rendered strictly via textContent
 */

import { Card } from '../model/card';

export const MAX_HASH_PAYLOAD_BYTES = 2048;

export interface HandoffPayload {
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
  rawText?: string;
}

/**
 * Format a card into a calm, human-readable plain-text template.
 */
export function formatPlainTextCard(card: {
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
  rawText?: string;
}): string {
  const lines: string[] = [
    '📌 PickUp Card:',
    `• Where I was: ${card.whereIWas || card.rawText || 'In the middle of work'}`,
    `• Next 5-min action: ${card.nextAction || 'Spend 5 minutes reviewing notes'}`,
  ];

  if (card.waitingOn && card.waitingOn.trim()) {
    lines.push(`• Waiting on: ${card.waitingOn.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Encodes a card into a safe, compressed URL hash payload.
 */
export function encodeCardForUrl(card: {
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
  rawText?: string;
}): string {
  const payload: HandoffPayload = {
    whereIWas: card.whereIWas || '',
    nextAction: card.nextAction || '',
    waitingOn: card.waitingOn || undefined,
    rawText: card.rawText || undefined,
  };

  const jsonStr = JSON.stringify(payload);
  // URL-safe Base64 encoding
  let base64 = '';
  if (typeof btoa !== 'undefined') {
    base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  } else if (typeof (globalThis as any).Buffer !== 'undefined') {
    base64 = (globalThis as any).Buffer.from(jsonStr, 'utf-8').toString('base64');
  }

  return encodeURIComponent(base64);
}

/**
 * Generates a full shareable link using window.location.
 */
export function generateShareUrl(
  card: Pick<Card, 'whereIWas' | 'nextAction' | 'waitingOn' | 'rawText'>,
  origin: string = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://pickup.local/'
): string {
  const hash = encodeCardForUrl(card);
  return `${origin}#handoff=${hash}`;
}

/**
 * Decodes and rigorously validates an untrusted hash payload.
 * Returns null if oversized, malformed, or invalid.
 */
export function decodeCardFromHash(rawHash: string): HandoffPayload | null {
  if (!rawHash || typeof rawHash !== 'string') {
    return null;
  }

  // Extract hash parameter value
  let hashValue = rawHash;
  if (hashValue.startsWith('#')) {
    hashValue = hashValue.slice(1);
  }
  if (hashValue.startsWith('handoff=')) {
    hashValue = hashValue.slice('handoff='.length);
  }

  // 1. Enforce strict size limit (2048 bytes)
  if (hashValue.length > MAX_HASH_PAYLOAD_BYTES) {
    console.warn('[PickUp:Handoff] Hash payload exceeds 2048 byte limit.');
    return null;
  }

  try {
    const decodedUrlParam = decodeURIComponent(hashValue);
    const jsonStr = typeof atob !== 'undefined'
      ? decodeURIComponent(escape(atob(decodedUrlParam)))
      : (typeof (globalThis as any).Buffer !== 'undefined'
          ? (globalThis as any).Buffer.from(decodedUrlParam, 'base64').toString('utf-8')
          : '');

    // Prevent oversized JSON before parsing
    if (jsonStr.length > MAX_HASH_PAYLOAD_BYTES) {
      return null;
    }

    const parsed = JSON.parse(jsonStr);

    // Validate structural schema
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    // Validate and sanitize fields
    const whereIWas = typeof parsed.whereIWas === 'string' ? parsed.whereIWas.slice(0, 500).trim() : '';
    const nextAction = typeof parsed.nextAction === 'string' ? parsed.nextAction.slice(0, 500).trim() : '';
    const waitingOn = typeof parsed.waitingOn === 'string' ? parsed.waitingOn.slice(0, 300).trim() : undefined;
    const rawText = typeof parsed.rawText === 'string' ? parsed.rawText.slice(0, 1000).trim() : undefined;

    // Both whereIWas and nextAction are core cues
    if (!whereIWas && !nextAction && !rawText) {
      return null;
    }

    return {
      whereIWas: whereIWas || rawText || 'Shared task',
      nextAction: nextAction || 'Spend 5 minutes reviewing where they left off',
      waitingOn: waitingOn || undefined,
      rawText: rawText || undefined,
    };
  } catch (error) {
    console.warn('[PickUp:Handoff] Failed to decode untrusted handoff hash:', error);
    return null;
  }
}

/**
 * Feature detect Web Share API.
 */
export function isWebShareSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.share === 'function';
}

/**
 * Triggers native Web Share API with safe fallback detection.
 */
export async function shareCard(
  card: Pick<Card, 'whereIWas' | 'nextAction' | 'waitingOn' | 'rawText'>
): Promise<boolean> {
  if (!isWebShareSupported()) {
    return false;
  }

  const shareData: ShareData = {
    title: 'PickUp Card',
    text: formatPlainTextCard(card),
    url: generateShareUrl(card),
  };

  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
      return false;
    }
    await navigator.share(shareData);
    return true;
  } catch (error) {
    // AbortError indicates user dismissed the native share sheet
    if ((error as any)?.name !== 'AbortError') {
      console.warn('[PickUp:Handoff] Web Share error:', error);
    }
    return false;
  }
}

/**
 * Copies plain text to clipboard safely.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback using textarea selection
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (error) {
    console.warn('[PickUp:Handoff] Clipboard copy failed:', error);
    return false;
  }
}
