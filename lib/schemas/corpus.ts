import { z } from "zod";

/** Roles a source document can play in the closed corpus. */
export const RoleSchema = z.enum(["rules", "notes", "model"]);
export type Role = z.infer<typeof RoleSchema>;

export const TaxonomyKindSchema = z.enum(["jr-ground", "jr-threshold", "mr", "remedy"]);
export type TaxonomyKind = z.infer<typeof TaxonomyKindSchema>;

export const CorpusDocSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  role: RoleSchema,
  file: z.string().min(1),
  chunkCount: z.number().int().nonnegative(),
});
export type CorpusDoc = z.infer<typeof CorpusDocSchema>;

export const CorpusChunkSchema = z.object({
  id: z.string().min(1),
  docId: z.string().min(1),
  role: RoleSchema,
  headingPath: z.array(z.string()),
  locationLabel: z.string().min(1),
  text: z.string().min(1),
});
export type CorpusChunk = z.infer<typeof CorpusChunkSchema>;

export const AuthoritySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["case", "statute"]),
  name: z.string().min(1),
  normalized: z.string().min(1),
  locations: z.array(z.string().min(1)).min(1),
});
export type Authority = z.infer<typeof AuthoritySchema>;

export const PinpointSchema = z.object({
  label: z.string().min(1),
  normalized: z.string().min(1),
  locations: z.array(z.string().min(1)).min(1),
});
export type Pinpoint = z.infer<typeof PinpointSchema>;

export const TaxonomyItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: TaxonomyKindSchema,
  locations: z.array(z.string().min(1)).min(1),
});
export type TaxonomyItem = z.infer<typeof TaxonomyItemSchema>;

export const CorpusIndexSchema = z.object({
  schemaVersion: z.literal(1),
  corpusVersion: z.string().min(1),
  docs: z.array(CorpusDocSchema).min(1),
  roleMap: z.record(z.string(), RoleSchema),
  chunks: z.array(CorpusChunkSchema).min(1),
  authorities: z.array(AuthoritySchema),
  pinpoints: z.array(PinpointSchema),
  taxonomy: z.array(TaxonomyItemSchema),
  stats: z.object({
    docCount: z.number().int().nonnegative(),
    chunkCount: z.number().int().nonnegative(),
    authorityCount: z.number().int().nonnegative(),
    pinpointCount: z.number().int().nonnegative(),
    taxonomyCount: z.number().int().nonnegative(),
  }),
});
export type CorpusIndex = z.infer<typeof CorpusIndexSchema>;
