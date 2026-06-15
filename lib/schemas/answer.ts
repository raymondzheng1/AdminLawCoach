import { z } from "zod";

/**
 * Structured generation outputs. Every authority an answer relies on is declared
 * as a Citation bound to a corpus chunk — the verifier (lib/verification) checks
 * each one resolves to the committed corpus, pinpointed (§7, §11.2).
 */
export const CitationSchema = z.object({
  authority: z.string().min(1), // e.g. "Kirk" or "VCAT Act 1998 (Vic) s 42(1)"
  pinpoint: z.string().min(1), // e.g. "Sem 23 s11–12" or a chunk location label
  chunkId: z.string().min(1), // the corpus chunk this is grounded in
  quote: z.string().optional(), // short supporting quote from that chunk
});
export type Citation = z.infer<typeof CitationSchema>;

/** Used by Ask, Explain, and Model-answer modes. */
export const GroundedAnswerSchema = z.object({
  notCovered: z.boolean(),
  answerMarkdown: z.string(),
  citations: z.array(CitationSchema),
});
export type GroundedAnswer = z.infer<typeof GroundedAnswerSchema>;

export const QuestionTypeSchema = z.enum(["hypothetical", "essay"]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/** A generated practice item. It poses a problem; it makes no authority claims. */
export const GeneratedQuestionSchema = z.object({
  type: QuestionTypeSchema,
  topicId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  guidance: z.string().optional(),
});
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export const FeedbackSchema = z.object({
  notCovered: z.boolean(),
  issuesSpotted: z.array(z.string()),
  issuesMissed: z.array(z.string()),
  structureComments: z.string(),
  authorityUse: z.object({
    ok: z.boolean(),
    notes: z.string(),
    flagged: z.array(z.string()), // authorities the student used that are NOT in the corpus
  }),
  applicationDepth: z.string(),
  rubricScore: z.number().int().min(0).max(100),
  actions: z.array(z.string()),
  citations: z.array(CitationSchema),
});
export type Feedback = z.infer<typeof FeedbackSchema>;
