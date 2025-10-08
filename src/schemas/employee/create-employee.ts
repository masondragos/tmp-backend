import z from "zod"

// model Employee{
//     id Int @id @default(autoincrement())
//     created_at DateTime @default(now())
//     updated_at DateTime @updatedAt
//     name String
//     email String @unique
//     password String
//     role Role
//   }

export const inviteEmployeeSchema = z.object({
    email: z.string().min(1,"Employee email is required"),
    name: z.string().min(1,"Employee name is required"),
})

export const createEmployeeSchema = z.object({
    token: z.string().min(1,"Employee token is required"),
    password: z.string().min(1,"Employee password is required"),
})