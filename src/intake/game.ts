import type { ProgressStep, TriviaQuestion } from './types';

/**
 * The waiting game. Questions are about how engineering time actually gets
 * spent, so the answers prime the prospect for the page being generated
 * instead of being generic trivia.
 */
export const DEFAULT_QUESTIONS: TriviaQuestion[] = [
  {
    question: 'How much of an engineer’s week typically goes to work nobody chose — migrations, flaky tests, dependency bumps?',
    options: ['Under 10%', 'About 20%', '30% or more'],
    answerIndex: 2,
    explanation:
      'Most teams we work with land north of 30% once they count code review, upgrades and backlog toil.',
  },
  {
    question: 'What is the most common first job teams hand to Devin?',
    options: ['Greenfield product work', 'Backlog and migration work', 'Incident response'],
    answerIndex: 1,
    explanation:
      'Well-specified, repetitive work is where Devin compounds fastest — and it is the work engineers least want.',
  },
  {
    question: 'A framework upgrade across 400 repositories. What changes with Devin?',
    options: [
      'It still takes one team a quarter',
      'It runs in parallel across repositories',
      'It gets deprioritized again',
    ],
    answerIndex: 1,
    explanation:
      'Devin sessions run in parallel, so fleet-wide changes stop being a headcount problem.',
  },
  {
    question: 'Who reviews the code Devin writes?',
    options: ['Nobody, it ships itself', 'Your engineers, in your normal PR flow', 'Cognition staff'],
    answerIndex: 1,
    explanation: 'Devin opens pull requests into your existing review and CI process. You stay in control.',
  },
  {
    question: 'What is the fastest way to tell whether Devin pays for itself?',
    options: [
      'Wait for the annual review',
      'Multiply engineers by toil by what Devin absorbs',
      'Count lines of code',
    ],
    answerIndex: 1,
    explanation: 'That is exactly the calculator waiting for you on the next page — with your own numbers.',
  },
  {
    question: 'Your page is being built from what, exactly?',
    options: [
      'Data you upload',
      'Public information about your company',
      'Your private repositories',
    ],
    answerIndex: 1,
    explanation:
      'Only public sources — your site, press, job postings — plus published Devin customer stories. Every claim on the page links to where it came from.',
  },
];

/** Progress copy for the wait, timed to the generation pipeline. */
export const DEFAULT_STEPS: ProgressStep[] = [
  { label: 'Checking your website', startsAt: 0 },
  { label: 'Researching your company', startsAt: 6 },
  { label: 'Finding proof points from Devin customers', startsAt: 30 },
  { label: 'Building your page', startsAt: 60 },
  { label: 'Locking it with your password', startsAt: 90 },
];

/** How many questions a prospect gets through in `seconds` of waiting. */
export function questionsForWait(seconds: number, secondsPerQuestion = 20): number {
  return Math.max(1, Math.ceil(seconds / secondsPerQuestion));
}
