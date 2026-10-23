import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateStudyStats,
  formatTrialsAsCSV,
  StudyTrial,
} from '../src/model/study';
import {
  getStudyTrials,
  saveStudyTrial,
  deleteStudyTrial,
  clearAllStudyTrials,
  STUDY_STORAGE_KEY,
  _resetMemoryTrialsForTesting,
} from '../src/storage/studyStorage';
import { Stopwatch } from '../src/lib/stopwatch';

describe('Study & Evidence Module (Phase 7)', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    _resetMemoryTrialsForTesting();

    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, val: string) => {
        mockStore[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
      length: 0,
      key: () => null,
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe('calculateStudyStats', () => {
    it('returns zeroes for empty trials', () => {
      const stats = calculateStudyStats([]);
      expect(stats.totalTrials).toBe(0);
      expect(stats.withPickUpCount).toBe(0);
      expect(stats.withoutPickUpCount).toBe(0);
      expect(stats.withPickUpAvgResumeSeconds).toBe(0);
      expect(stats.withoutPickUpAvgResumeSeconds).toBe(0);
    });

    it('computes accurate condition breakdown and mean metrics', () => {
      const sampleTrials: StudyTrial[] = [
        {
          id: '1',
          participantCode: 'P01',
          condition: 'with_pickup',
          resumeTimeSeconds: 12.0,
          lostRating: 1,
          timestamp: '2026-10-23T00:00:00Z',
        },
        {
          id: '2',
          participantCode: 'P02',
          condition: 'with_pickup',
          resumeTimeSeconds: 16.0,
          lostRating: 2,
          timestamp: '2026-10-23T00:05:00Z',
        },
        {
          id: '3',
          participantCode: 'P01',
          condition: 'without_pickup',
          resumeTimeSeconds: 45.0,
          lostRating: 4,
          timestamp: '2026-10-23T00:10:00Z',
        },
        {
          id: '4',
          participantCode: 'P02',
          condition: 'without_pickup',
          resumeTimeSeconds: 55.0,
          lostRating: 5,
          timestamp: '2026-10-23T00:15:00Z',
        },
      ];

      const stats = calculateStudyStats(sampleTrials);
      expect(stats.totalTrials).toBe(4);
      expect(stats.withPickUpCount).toBe(2);
      expect(stats.withoutPickUpCount).toBe(2);
      expect(stats.withPickUpAvgResumeSeconds).toBe(14.0); // (12 + 16)/2
      expect(stats.withoutPickUpAvgResumeSeconds).toBe(50.0); // (45 + 55)/2
      expect(stats.withPickUpAvgLostRating).toBe(1.5); // (1 + 2)/2
      expect(stats.withoutPickUpAvgLostRating).toBe(4.5); // (4 + 5)/2
    });
  });

  describe('formatTrialsAsCSV', () => {
    it('creates RFC 4180 CSV with headers and escaped fields', () => {
      const trials: StudyTrial[] = [
        {
          id: 'trial_1',
          participantCode: 'P01',
          condition: 'with_pickup',
          resumeTimeSeconds: 14.5,
          lostRating: 2,
          notes: 'Paused briefly, then remembered',
          timestamp: '2026-10-23T01:00:00.000Z',
        },
        {
          id: 'trial_2',
          participantCode: 'P02',
          condition: 'without_pickup',
          resumeTimeSeconds: 42.0,
          lostRating: 4,
          notes: 'Said: "Where was I?", opened wrong tab',
          timestamp: '2026-10-23T01:10:00.000Z',
        },
      ];

      const csv = formatTrialsAsCSV(trials);
      expect(csv).toContain('Trial ID,Participant Code,Condition,Resume Time (seconds),Lost Rating (1-5),Notes,Timestamp');
      expect(csv).toContain('P01,With PickUp,14.5,2,"Paused briefly, then remembered"');
      expect(csv).toContain('"Said: ""Where was I?"", opened wrong tab"');
    });
  });

  describe('Study Storage', () => {
    it('saves a trial with uppercase participant code and unique ID', () => {
      const trial = saveStudyTrial({
        participantCode: 'p03',
        condition: 'with_pickup',
        resumeTimeSeconds: 11.2,
        lostRating: 1,
      });

      expect(trial.id).toMatch(/^trial_/);
      expect(trial.participantCode).toBe('P03');
      expect(trial.timestamp).toBeDefined();

      const saved = getStudyTrials();
      expect(saved.length).toBe(1);
      expect(saved[0].participantCode).toBe('P03');
    });

    it('deletes an individual trial by ID', () => {
      const t1 = saveStudyTrial({ participantCode: 'P01', condition: 'with_pickup', resumeTimeSeconds: 10, lostRating: 1 });
      const t2 = saveStudyTrial({ participantCode: 'P02', condition: 'without_pickup', resumeTimeSeconds: 30, lostRating: 3 });

      expect(getStudyTrials().length).toBe(2);
      deleteStudyTrial(t1.id);

      const remaining = getStudyTrials();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(t2.id);
    });

    it('clears all trials', () => {
      saveStudyTrial({ participantCode: 'P01', condition: 'with_pickup', resumeTimeSeconds: 10, lostRating: 1 });
      saveStudyTrial({ participantCode: 'P02', condition: 'with_pickup', resumeTimeSeconds: 12, lostRating: 2 });
      expect(getStudyTrials().length).toBe(2);

      clearAllStudyTrials();
      expect(getStudyTrials().length).toBe(0);
    });

    it('handles corrupted localStorage JSON gracefully', () => {
      mockStore[STUDY_STORAGE_KEY] = '{{corrupted';
      const trials = getStudyTrials();
      expect(Array.isArray(trials)).toBe(true);
      expect(trials.length).toBe(0);
    });
  });

  describe('Stopwatch', () => {
    it('formats milliseconds into mm:ss.t string accurately', () => {
      const sw = new Stopwatch();
      expect(sw.format(0)).toBe('00:00.0');
      expect(sw.format(15400)).toBe('00:15.4');
      expect(sw.format(65200)).toBe('01:05.2');
    });

    it('resets cleanly to 0', () => {
      let currentVal = '';
      const sw = new Stopwatch({
        onTick: (_, formatted) => {
          currentVal = formatted;
        },
      });

      sw.reset();
      expect(currentVal).toBe('00:00.0');
      expect(sw.running()).toBe(false);
      expect(sw.getElapsedSeconds()).toBe(0);
    });
  });
});
