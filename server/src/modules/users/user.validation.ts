import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID."),
});
