/**
 * Study & Evidence Data Models (Phase 7)
 * Defines trial records and summary statistics for the hidden ?study=1 evaluation mode.
 * Strictly anonymous: participant codes only, no PII.
 */

export type StudyCondition = 'with_pickup' | 'without_pickup';

export interface StudyTrial {
  id: string;
  participantCode: string; // e.g. "P01", "P02" (no personal names)
  condition: StudyCondition;
  resumeTimeSeconds: number; // Time elapsed to resume in seconds (e.g. 18.5)
  lostRating: number; // 1 (immediately clear) to 5 (completely disoriented)
  notes?: string; // Optional qualitative observation
  timestamp: string; // ISO 8601 string
}

export interface StudySummaryStats {
  totalTrials: number;
  withPickUpCount: number;
  withoutPickUpCount: number;
  withPickUpAvgResumeSeconds: number;
  withoutPickUpAvgResumeSeconds: number;
  withPickUpAvgLostRating: number;
  withoutPickUpAvgLostRating: number;
}

/**
 * Calculates aggregate summary statistics comparing "With PickUp" vs "Without PickUp".
 */
export function calculateStudyStats(trials: StudyTrial[]): StudySummaryStats {
  const withPickUp = trials.filter((t) => t.condition === 'with_pickup');
  const withoutPickUp = trials.filter((t) => t.condition === 'without_pickup');

  const calcAvg = (items: StudyTrial[], key: 'resumeTimeSeconds' | 'lostRating') => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, curr) => acc + curr[key], 0);
    return Math.round((sum / items.length) * 10) / 10;
  };

  return {
    totalTrials: trials.length,
    withPickUpCount: withPickUp.length,
    withoutPickUpCount: withoutPickUp.length,
    withPickUpAvgResumeSeconds: calcAvg(withPickUp, 'resumeTimeSeconds'),
    withoutPickUpAvgResumeSeconds: calcAvg(withoutPickUp, 'resumeTimeSeconds'),
    withPickUpAvgLostRating: calcAvg(withPickUp, 'lostRating'),
    withoutPickUpAvgLostRating: calcAvg(withoutPickUp, 'lostRating'),
  };
}

/**
 * Formats trial data as an RFC 4180 compliant CSV string.
 * Escapes quotes, commas, and line breaks safely.
 */
export function formatTrialsAsCSV(trials: StudyTrial[]): string {
  const headers = [
    'Trial ID',
    'Participant Code',
    'Condition',
    'Resume Time (seconds)',
    'Lost Rating (1-5)',
    'Notes',
    'Timestamp',
  ];

  const escapeCSV = (value: string | number | undefined) => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = trials.map((t) => [
    escapeCSV(t.id),
    escapeCSV(t.participantCode),
    escapeCSV(t.condition === 'with_pickup' ? 'With PickUp' : 'Without PickUp (Control)'),
    escapeCSV(t.resumeTimeSeconds),
    escapeCSV(t.lostRating),
    escapeCSV(t.notes || ''),
    escapeCSV(t.timestamp),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
