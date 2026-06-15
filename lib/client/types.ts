import type { Citation, GeneratedQuestion, Feedback } from "@/lib/schemas/answer";

export interface SourceRef {
  authority: string;
  pinpoint: string;
  chunkId: string;
  quote?: string;
  locationLabel: string;
  role: string;
  excerpt: string;
}

export interface UsageInfo {
  spentUsd: number;
  byoKey: boolean;
}

export interface GroundedResponse {
  notCovered: boolean;
  answerMarkdown: string;
  citations: Citation[];
  sources: SourceRef[];
  usage: UsageInfo;
}

export interface QuestionResponse {
  question: GeneratedQuestion;
  topicLabel: string;
  usage: UsageInfo;
}

export interface FeedbackResponse {
  notCovered: boolean;
  feedback: Feedback | null;
  sources: SourceRef[];
  usage: UsageInfo;
}

export interface UsageResponse {
  spentUsd: number;
  capUsd: number;
  byoKey: boolean;
}

export interface MetaResponse {
  corpusVersion: string;
  docs: { id: string; title: string; role: string }[];
  taxonomy: { id: string; label: string; kind: string; count: number }[];
  stats: { docCount: number; chunkCount: number; authorityCount: number; pinpointCount: number; taxonomyCount: number };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
