import { z } from "zod";

export const loginSchema = z.object({
    username: z
        .string()
        .trim()
        .min(1, "Username is required.")
        .min(3, "Username must be at least 3 characters.")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscore."),

    password: z
        .string()
        .min(1, "Password is required.")
        .min(6, "Password must be at least 6 characters."),
});

export const registerSchema = z
    .object({
        username: z
            .string()
            .trim()
            .min(1, "Username is required.")
            .min(3, "Username must be at least 3 characters.")
            .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscore."),

        email: z
            .string()
            .trim()
            .min(1, "Email is required.")
            .email("Please enter a valid email address."),

        password: z
            .string()
            .min(1, "Password is required.")
            .min(6, "Password must be at least 6 characters."),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your password."),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;