import { z } from "zod";
import { CitationSchema } from "@/lib/schemas/answer";

/**
 * Client-only persisted state (localStorage). No user content is ever stored
 * server-side (PRD §8). Schemas are versioned so a future shape change migrates
 * rather than crashes.
 */
export const STORE_VERSION = 1;

export const StoredQuestionSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  topicId: z.string(),
  type: z.enum(["hypothetical", "essay"]),
  title: z.string(),
  prompt: z.string(),
  guidance: z.string().optional(),
});
export type StoredQuestion = z.infer<typeof StoredQuestionSchema>;

export const StoredFeedbackSchema = z.object({
  issuesSpotted: z.array(z.string()),
  issuesMissed: z.array(z.string()),
  structureComments: z.string(),
  authorityUse: z.object({ ok: z.boolean(), notes: z.string(), flagged: z.array(z.string()) }),
  applicationDepth: z.string(),
  rubricScore: z.number(),
  actions: z.array(z.string()),
  citations: z.array(CitationSchema),
});

export const StoredAttemptSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  topicId: z.string().optional(),
  kind: z.enum(["hypothetical", "essay"]),
  question: z.string(),
  attemptText: z.string(),
  wordCount: z.number(),
  feedback: StoredFeedbackSchema.optional(),
  score: z.number().optional(),
});
export type StoredAttempt = z.infer<typeof StoredAttemptSchema>;

export const TopicProgressSchema = z.object({
  practiced: z.number(),
  attempts: z.number(),
  scoredCount: z.number(),
  scoreSum: z.number(),
  lastScore: z.number().optional(),
});
export type TopicProgress = z.infer<typeof TopicProgressSchema>;

export const ProgressSchema = z.object({
  byTopic: z.record(z.string(), TopicProgressSchema),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const StoreSchema = z.object({
  version: z.literal(STORE_VERSION),
  attempts: z.array(StoredAttemptSchema),
  questions: z.array(StoredQuestionSchema),
  progress: ProgressSchema,
});
export type Store = z.infer<typeof StoreSchema>;

export const EMPTY_STORE: Store = { version: STORE_VERSION, attempts: [], questions: [], progress: { byTopic: {} } };
