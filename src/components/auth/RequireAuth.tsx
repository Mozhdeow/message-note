"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

export default function RequireAuth({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isLoading } = useUser();

    useEffect(() => {
        if (!isLoading && !user?.isLoggedIn) {
            router.replace("/login");
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-white">
                Checking your account...
            </div>
        );
    }

    if (!user?.isLoggedIn) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-white">
                Redirecting...
            </div>
        );
    }

    return <>{children}</>;
}