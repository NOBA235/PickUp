/**
 * Core domain model for a PickUp card.
 * Designed to answer 3 essential questions after an interruption:
 * 1. Where was I?
 * 2. What is my next 5-minute action?
 * 3. Am I waiting on anything/anyone?
 */
export interface PickupCard {
  id: string;
  whereIWas: string;
  nextAction: string;
  waitingOn?: string;
  createdAt: number;
  updatedAt: number;
}

export function createEmptyCard(id: string = crypto.randomUUID()): PickupCard {
  const now = Date.now();
  return {
    id,
    whereIWas: '',
    nextAction: '',
    waitingOn: '',
    createdAt: now,
    updatedAt: now,
  };
}
