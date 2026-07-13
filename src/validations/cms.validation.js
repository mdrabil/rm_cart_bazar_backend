import { z } from "zod";

export const createCmsSchema = z.object({
  title: z.string().min(3).max(200),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(300).optional(),
  slug: z.string().optional(),
  type: z.string().optional(),
  content: z.any(),
  status: z.enum(["draft", "published"]).optional(),
});

export const updateCmsSchema = createCmsSchema.partial();