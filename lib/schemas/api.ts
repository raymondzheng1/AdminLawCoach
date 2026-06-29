import { z } from "zod";

/** Request bodies for the stateless API routes (Zod at every boundary, §2.4). */
export const AskRequestSchema = z.object({
  question: z.string().trim().min(3).max(1000),
});
export type AskRequest = z.infer<typeof AskRequestSchema>;

export const ExplainRequestSchema = z.object({
  target: z.string().trim().min(2).max(200),
});
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

export const GenerateQuestionRequestSchema = z.object({
  type: z.enum(["hypothetical", "essay"]),
  topicId: z.string().trim().min(1).max(80),
});
export type GenerateQuestionRequest = z.infer<typeof GenerateQuestionRequestSchema>;

export const GenerateAnswerRequestSchema = z.object({
  question: z.string().trim().min(3).max(4000),
  kind: z.enum(["hypothetical", "essay"]),
});
export type GenerateAnswerRequest = z.infer<typeof GenerateAnswerRequestSchema>;

export const ContactRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(2000),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export const FeedbackRequestSchema = z.object({
  question: z.string().trim().min(3).max(4000),
  attemptText: z.string().trim().min(10).max(12000),
  kind: z.enum(["hypothetical", "essay"]),
});
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
