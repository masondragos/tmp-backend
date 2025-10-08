import z from "zod";

export const prioritiesSchema = z.object({
  speed_of_closing: z.boolean(),
  low_fees: z.boolean(),
  high_leverage: z.boolean(),
  quote_id: z.number().int(),
  comments: z.string().optional(),
});
