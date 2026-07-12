"use client";

import { useQuery } from "@tanstack/react-query";

export type User = {
    id: number;
    username: string;
    full_name?: string | null;
    email: string;
    avatar?: string | null;
    role: "user" | "support" | "admin";
    status?: string;
    isLoggedIn: boolean;
};

async function getUserStatus(): Promise<User | null> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_PHP_API}/process.php?action=status`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    const result = await res.json();

    if (!result.isLoggedIn) {
        return null;
    }

    return result.user;
}

export function useUser() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["auth-user"],
        queryFn: getUserStatus,
        retry: false,
    });

    return {
        user: data,
        isLoading,
        refetchUser: refetch,
    };
}