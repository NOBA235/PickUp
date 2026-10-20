/**
 * Test Fixtures for Card Builder (Phase 3)
 * Covers edge cases: empty input, long input, run-ons, lack of punctuation, and non-English text.
 */

export interface ExtractorFixture {
  id: string;
  name: string;
  input: string;
  expectedWhereContains?: string;
  expectedNextContains?: string;
  expectedWaitingContains?: string;
}

export const cardExtractorFixtures: ExtractorFixture[] = [
  {
    id: 'empty-string',
    name: 'Empty input string',
    input: '',
    expectedWhereContains: 'Work in progress',
  },
  {
    id: 'whitespace-only',
    name: 'Whitespace only input',
    input: '   \n\t  \r\n   ',
    expectedWhereContains: 'Work in progress',
  },
  {
    id: 'standard-all-cues',
    name: 'Standard input with all three cues',
    input: 'Was working on the biology lab report. Next step is draft the hypothesis section. Waiting on email from lab partner.',
    expectedWhereContains: 'Biology lab report',
    expectedNextContains: 'Draft the hypothesis section',
    expectedWaitingContains: 'Email from lab partner',
  },
  {
    id: 'stuck-on-cue',
    name: 'Stuck on cue extraction',
    input: 'Stuck on memory leak in canvas renderer. Waiting for team lead to approve PR.',
    expectedNextContains: 'Investigate for 5 minutes',
    expectedWaitingContains: 'Team lead to approve PR',
  },
  {
    id: 'finished-cue',
    name: 'Finished cue extraction',
    input: 'Finished writing unit tests for payment service. Next write integration test for webhooks.',
    expectedWhereContains: 'Finished',
    expectedNextContains: 'Write integration test',
  },
  {
    id: 'was-doing-cue',
    name: 'Was doing cue extraction',
    input: 'Was doing user research synthesis for the new mobile onboarding flow.',
    expectedWhereContains: 'User research synthesis',
  },
  {
    id: 'need-to-cue',
    name: 'Need to cue extraction',
    input: 'Reading chapter 3 on neural networks. Need to summarize the key takeaways on page 45.',
    expectedWhereContains: 'Chapter 3 on neural networks',
    expectedNextContains: 'Summarize the key takeaways',
  },
  {
    id: 'no-punctuation',
    name: 'Completely unpunctuated input',
    input: 'working on physics homework next step solve equation 4 waiting on tutor response',
    expectedWhereContains: 'Physics homework',
    expectedNextContains: 'Solve equation 4',
    expectedWaitingContains: 'Tutor response',
  },
  {
    id: 'run-on-sentence',
    name: 'Messy run-on sentence without clear boundaries',
    input: 'and then I was working on setting up tailwind config and next I have to fix the font import and I am waiting for the npm install to finish',
    expectedWhereContains: 'Setting up tailwind config',
    expectedNextContains: 'Fix the font import',
    expectedWaitingContains: 'The npm install to finish',
  },
  {
    id: 'very-long-input',
    name: 'Extremely long note (over 10,000 characters)',
    input: 'Was researching the historical impact of the printing press in 15th century Europe. '.repeat(150) +
           ' Next need to organize bibliography. Waiting on library book scan.',
    expectedWhereContains: 'Printing press',
    expectedNextContains: 'Organize bibliography',
    expectedWaitingContains: 'Library book scan',
  },
  {
    id: 'non-english-spanish',
    name: 'Non-English input (Spanish)',
    input: 'Estaba redactando la propuesta del proyecto para el cliente. Luego revisar los costos estimados.',
    expectedWhereContains: 'Estaba redactando',
  },
  {
    id: 'non-english-german',
    name: 'Non-English input (German)',
    input: 'Ich habe an der Präsentation für das morgige Meeting gearbeitet. Folie drei braucht noch Diagramme.',
    expectedWhereContains: 'Ich habe',
  },
  {
    id: 'non-english-japanese',
    name: 'Non-English input (Japanese)',
    input: '心理学のレポートの第2章を執筆していました。次は実験データのグラフを作成します。',
    expectedWhereContains: '心理学のレポート',
  },
  {
    id: 'emojis-and-symbols',
    name: 'Input with emojis, currency, and special symbols',
    input: '📊 Was working on Q3 budget sheet ($45,000 variance). Next: review tax calculation formulas. ⏳ Waiting for audit approval from Sarah.',
    expectedWhereContains: 'Q3 budget sheet',
    expectedNextContains: 'Review tax calculation',
    expectedWaitingContains: 'Audit approval from Sarah',
  },
];
