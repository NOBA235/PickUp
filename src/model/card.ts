/**
 * PickUp Card Domain Model
 *
 * Represents a mental checkpoint after an interruption.
 */

export type CardStatus = 'parked' | 'resumed' | 'done';
export type CardSource = 'rules' | 'ai' | 'manual';

export interface Card {
  id: string;
  createdAt: number;
  rawText: string;
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
  status: CardStatus;
  source: CardSource;
  updatedAt?: number;
}

export interface CreateCardInput {
  id?: string;
  createdAt?: number;
  rawText?: string;
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
  status?: CardStatus;
  source?: CardSource;
}

/**
 * Creates a validated Card instance with defaults.
 */
export function createCard(input: CreateCardInput): Card {
  const now = input.createdAt ?? Date.now();
  const id = input.id ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `card_${now}_${Math.random().toString(36).substring(2, 9)}`);

  return {
    id,
    createdAt: now,
    rawText: input.rawText ?? '',
    whereIWas: input.whereIWas.trim(),
    nextAction: input.nextAction.trim(),
    waitingOn: input.waitingOn ? input.waitingOn.trim() : undefined,
    status: input.status ?? 'parked',
    source: input.source ?? 'manual',
    updatedAt: now,
  };
}
