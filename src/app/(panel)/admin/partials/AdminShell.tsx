"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BiLoaderAlt, BiLockAlt } from "react-icons/bi";
import { toast } from "sonner";

import AdminSidebar from "./AdminSidebar";

type PanelRole = "admin" | "support";

export type PanelUser = {
    id: number;
    full_name?: string | null;
    username?: string | null;
    email?: string | null;
    avatar?: string | null;
    role: PanelRole;
    status: string;
};

const isSupportAllowedPath = (pathname: string) => {
    return (
        pathname === "/admin/tickets" ||
        pathname.startsWith("/admin/tickets/") ||

        pathname === "/admin/playlists" ||
        pathname.startsWith("/admin/playlists/")
    );
};

export default function AdminShell({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const [currentUser, setCurrentUser] = useState<PanelUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        checkAccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        if (currentUser.role === "admin") {
            setAllowed(true);
            return;
        }

        if (currentUser.role === "support") {
            if (isSupportAllowedPath(pathname)) {
                setAllowed(true);
            } else {
                setAllowed(false);
                router.replace("/admin/tickets");
            }
        }
    }, [currentUser, pathname, router]);

    const checkAccess = async () => {
        setLoading(true);

        try {
            const apiBase = process.env.NEXT_PUBLIC_PHP_API;

            if (!apiBase) {
                throw new Error("API URL is not configured.");
            }

            const res = await fetch(`${apiBase}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_me",
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid admin_me response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Panel access denied.");
            }

            const user = result.user as PanelUser;

            setCurrentUser(user);

            if (user.role === "admin") {
                setAllowed(true);
                return;
            }

            if (user.role === "support") {
                if (isSupportAllowedPath(pathname)) {
                    setAllowed(true);
                } else {
                    setAllowed(false);
                    router.replace("/admin/tickets");
                }

                return;
            }

            setAllowed(false);
            router.replace("/dashboard");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Panel access denied.";

            console.error("Panel access error:", error);

            if (!message.toLowerCase().includes("logged in")) {
                toast.error(message);
            }

            setAllowed(false);
            window.location.replace("/login");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050711] text-white">
                <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 py-7 text-center backdrop-blur-xl">
                    <BiLoaderAlt className="h-10 w-10 animate-spin text-primary" />

                    <div>
                        <h2 className="text-xl font-black text-white">
                            Checking panel access
                        </h2>

                        <p className="mt-2 text-sm font-bold text-white/40">
                            Please wait...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!allowed || !currentUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050711] text-white">
                <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 py-7 text-center backdrop-blur-xl">
                    <BiLockAlt className="h-10 w-10 text-red-300" />

                    <div>
                        <h2 className="text-xl font-black text-white">
                            Access denied
                        </h2>

                        <p className="mt-2 text-sm font-bold text-white/40">
                            You do not have permission to view this page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen ">
            <AdminSidebar currentUser={currentUser} />

            <main className="min-h-screen px-4 py-5 transition-all duration-300 md:ml-[var(--admin-sidebar-width,290px)] md:px-8">
                <div className="mx-auto w-full max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}