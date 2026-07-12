"use client";

import React, {useRef, useState, useEffect} from "react";
import gsap from "gsap";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { FieldErrors } from "react-hook-form";

import { useRouter, } from "next/navigation";

import {
    loginSchema,
    registerSchema,
    LoginFormData,
    RegisterFormData,
} from "@/schemas/auth";

type FormType = "login" | "register" | "forgot";


function showValidationToasts<T extends Record<string, any>>(
    errors: FieldErrors<T>
) {
    const messages = Object.values(errors)
        .map((error) => error?.message)
        .filter(Boolean) as string[];

    if (!messages.length) {
        toast.error("Please check the form fields.");
        return;
    }

    messages.forEach((message) => {
        toast.error(message);
    });
}

export default function AuthCard() {

    const [form, setForm] = useState<FormType>("login");
    const cardRef = useRef<HTMLDivElement>(null);

    const changeForm = async (f: FormType) => {
        setForm(f);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "setAuthForm",
                    form: f,
                }).toString(),
            });
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const loadFormFromCookie = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    credentials: "include",
                    body: new URLSearchParams({
                        action: "getAuthForm"
                    }).toString(),
                });

                const result = await res.json();
                if (result.success && result.form) {
                    setForm(result.form);
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadFormFromCookie();
    }, []);


    useEffect(() => {
        if (!cardRef.current) return;

        const tl = gsap.timeline({
            defaults: {duration: 0.8, ease: "power3.inOut"},
        });

        if (form === "login") tl.to(cardRef.current, {rotateY: 0, rotateX: 0});
        if (form === "register") tl.to(cardRef.current, {rotateY: -90, rotateX: 0});
        if (form === "forgot") tl.to(cardRef.current, {rotateX: 90, rotateY: 0});
    }, [form]);

    return (
        <div className="flex items-center justify-center w-full min-h-[60vh]">
            <div className="relative w-full sm:max-w-md h-[420px] perspective">
                <div
                    ref={cardRef}
                    className="absolute inset-0 w-full h-full"
                    style={{transformStyle: "preserve-3d"}}
                >
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-md border-2 border-primary/60 p-8 rounded-lg "
                        style={{backfaceVisibility: "hidden"}}
                    >
                        <Login
                            onGoRegister={() => changeForm("register")}
                            onGoForgot={() => changeForm("forgot")}
                        />
                    </div>

                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-md border-2 border-secondary p-8 rounded-lg h-[580px] -top-16"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(90deg)",
                        }}
                    >
                        <Register
                            onGoLogin={() => changeForm("login")}
                            onGoForgot={() => changeForm("forgot")}
                        />
                    </div>

                    <div
                        className="absolute inset-0 backdrop-blur-md border-2 border-rose-500/60 p-8 rounded-lg  h-[420px]"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateX(-90deg)",
                        }}
                    >
                        <ForgotPassword onGoLogin={() => changeForm("login")}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface Props {
    onGoRegister?: () => void;
    onGoForgot?: () => void;
    onGoLogin?: () => void;
}


function Login({onGoRegister, onGoForgot}: Props) {
    const router = useRouter();

    const [serverError, setServerError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const schema = loginSchema;

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<LoginFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);

        const loadingToast = toast.loading("Signing in...");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "login",
                    username: data.username,
                    password: data.password,
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid PHP response:", text);

                toast.error("Server returned an invalid response. Check PHP errors.", {
                    id: loadingToast,
                });

                return;
            }

            if (result.success) {
                toast.success("Logged in successfully.", {
                    id: loadingToast,
                });

                router.push("/dashboard/profile");
                return;
            }

            const message =
                result.errors?.username ||
                result.errors?.password ||
                result.errors?.general ||
                result.message ||
                "Invalid username or password.";

            toast.error(message, {
                id: loadingToast,
            });
        } catch (error) {
            toast.error("Something went wrong. Please try again.", {
                id: loadingToast,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full h-full justify-between">
            <p className="text-3xl font-bold mb-8 border-b border-primary/50 pb-2">
                Login
            </p>

            <form
                noValidate
                onSubmit={handleSubmit(onSubmit, showValidationToasts<LoginFormData>)}
                className="w-full flex-1 flex flex-col justify-center"
            >
                <input
                    {...register("username")}
                    placeholder={"username"}
                    className="input-login border-third focus:ring-third"
                    autoComplete="username"
                />

                <input
                    {...register("password")}
                    type="password"
                    placeholder={"password"}
                    className="input-login border-third focus:ring-third mt-4"
                    autoComplete="current-password"
                />

                {serverError && (
                    <div
                        className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {serverError}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-submit mt-8 bg-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Login"}
                </button>
            </form>

            <div className="flex gap-2 mt-6 text-sm">
                <button className="link text-primary" onClick={onGoRegister}>
                    register
                </button>
                <span className="text-white">|</span>
                <button className="link text-primary" onClick={onGoForgot}>
                Forgot Password
                </button>
            </div>
        </div>
    );
}


function Register({ onGoLogin }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
    });

    const showValidationErrors = (errors: FieldErrors<RegisterFormData>) => {
        const messages = Object.values(errors)
            .map((error) => error?.message)
            .filter(Boolean) as string[];

        if (!messages.length) {
            toast.error("Please check the form fields.");
            return;
        }

        messages.forEach((message) => {
            toast.error(message);
        });
    };

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);

        const loadingToast = toast.loading("Creating your account...");

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_PHP_API}/process.php`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    credentials: "include",
                    body: new URLSearchParams({
                        action: "register",
                        email: data.email,
                        username: data.username,
                        password: data.password,
                        confirmPassword: data.confirmPassword,
                    }).toString(),
                }
            );

            const text = await res.text();

            let result: {
                success?: boolean;
                message?: string;
                errors?: {
                    username?: string;
                    email?: string;
                    password?: string;
                    confirmPassword?: string;
                    general?: string;
                };
            };

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid JSON response:", text);

                toast.error("Server returned an invalid response.", {
                    id: loadingToast,
                });

                return;
            }

            if (result.success) {
                toast.success("Account created successfully.", {
                    id: loadingToast,
                });

                reset();
                router.push("/dashboard/profile");
                return;
            }

            const errorMessage =
                result.errors?.username ||
                result.errors?.email ||
                result.errors?.password ||
                result.errors?.confirmPassword ||
                result.errors?.general ||
                result.message ||
                "Registration failed. Please try again.";

            toast.error(errorMessage, {
                id: loadingToast,
            });
        } catch (error) {
            console.error(error);

            toast.error("Something went wrong. Please try again.", {
                id: loadingToast,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col items-center justify-between">
            <p className="mb-6 border-b border-secondary pb-2 text-3xl font-bold">
                Create Account
            </p>

            <form
                noValidate
                onSubmit={handleSubmit(onSubmit, showValidationErrors)}
                className="flex w-full flex-1 flex-col justify-center"
            >
                <input
                    {...register("email")}
                    placeholder="Email"
                    className="input-login mt-2 border-secondary focus:ring-secondary"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                />

                <input
                    {...register("username")}
                    placeholder="Username"
                    className="input-login mt-4 border-secondary focus:ring-secondary"
                    autoComplete="username"
                    disabled={loading}
                />

                <input
                    {...register("password")}
                    placeholder="Password"
                    className="input-login mt-4 border-secondary focus:ring-secondary"
                    type="password"
                    autoComplete="new-password"
                    disabled={loading}
                />

                <input
                    {...register("confirmPassword")}
                    placeholder="Confirm Password"
                    className="input-login mt-4 border-secondary focus:ring-secondary"
                    type="password"
                    autoComplete="new-password"
                    disabled={loading}
                />

                <button
                    type="submit"
                    className="btn-submit mt-6 w-full bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Register"}
                </button>
            </form>

            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    className="link text-secondary disabled:cursor-not-allowed disabled:opacity-60 "
                    onClick={onGoLogin}
                    disabled={loading}
                >
                    Already have an account? Login
                </button>
            </div>
        </div>
    );
}

function ForgotPassword({ onGoLogin }: Props) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const isValidEmail = (value: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            toast.error("Email is required.");
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        const loadingToast = toast.loading("Checking your email...");

        try {
            await new Promise((resolve) => setTimeout(resolve, 700));

            toast.info("Forgot password is not implemented in this demo yet.", {
                id: loadingToast,
            });
        } catch (error) {
            console.error(error);

            toast.error("Something went wrong. Please try again.", {
                id: loadingToast,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col items-center justify-between">
            <p className="mb-8 border-b border-rose-500 pb-2 text-3xl font-bold">
                Reset Password
            </p>

            <form
                noValidate
                onSubmit={handleSubmit}
                className="flex w-full flex-1 flex-col items-center justify-center"
            >
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="input-login border-rose-500 focus:ring-rose-500"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                />

                <button
                    className="btn-submit mt-8 w-full bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Checking..." : "Reset Password"}
                </button>
            </form>

            <div className="mt-6 flex gap-2">
                <button
                    type="button"
                    className="link text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onGoLogin}
                    disabled={loading}
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}
