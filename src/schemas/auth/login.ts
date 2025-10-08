import z from "zod";

export const loginSchema = z.object({
    email: z.string().min(1, "Email is required").max(50,"Email should not be more then 50 characters"),
    password: z.string().min(1, "Password is required").max(15, "Password should not be more then 15 characters")
})