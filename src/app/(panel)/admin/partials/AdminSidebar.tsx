"use client";

import React, {useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import gsap from "gsap";
import {toast} from "sonner";
import {
    BiChevronLeft,
    BiChevronRight,
    BiHomeAlt,
    BiLockAlt,
    BiLogOut,
    BiMenu,
    BiSolidPlaylist,
    BiSupport,
    BiUser,
    BiX,
} from "react-icons/bi";

type PanelRole = "admin" | "support";

type PanelUser = {
    id: number;
    full_name?: string | null;
    username?: string | null;
    email?: string | null;
    avatar?: string | null;
    role: PanelRole;
    status: string;
};

type AdminSidebarProps = {
    currentUser: PanelUser;
};

type AdminNavItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
    roles: PanelRole[];
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    {
        label: "Overview",
        href: "/admin",
        icon: <BiHomeAlt/>,
        roles: ["admin"],
    },
    {
        label: "Users",
        href: "/admin/users",
        icon: <BiUser/>,
        roles: ["admin"],
    },
    {
        label: "Playlists",
        href: "/admin/playlists",
        icon: <BiSolidPlaylist/>,
        roles: ["admin", "support"],
    },
    {
        label: "Tickets",
        href: "/admin/tickets",
        icon: <BiSupport/>,
        badge: "Support",
        roles: ["admin", "support"],
    },
    {
        label: "Back To Site",
        href: "/",
        icon: <BiHomeAlt/>,
        badge: "Site",
        roles: ["admin", "support"],
    },
];

const isActivePath = (pathname: string, href: string) => {
    if (href === "/admin") {
        return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
};

const getImageUrl = (url?: string | null) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || "";
    const cleanBase = apiBase.replace(/\/$/, "");
    const cleanUrl = url.replace(/^\//, "");

    return cleanBase ? `${cleanBase}/${cleanUrl}` : `/${cleanUrl}`;
};

export default function AdminSidebar({currentUser}: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const sidebarRef = useRef<HTMLElement | null>(null);
    const navRef = useRef<HTMLDivElement | null>(null);

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const visibleNavItems = useMemo(() => {
        return ADMIN_NAV_ITEMS.filter((item) =>
            item.roles.includes(currentUser.role)
        );
    }, [currentUser.role]);

    const avatarUrl = getImageUrl(currentUser.avatar);
    const displayName =
        currentUser.full_name || currentUser.username || currentUser.email || "Admin";
    const initial = displayName.trim().charAt(0).toUpperCase();

    useEffect(() => {
        const saved = localStorage.getItem("admin_sidebar_collapsed");

        if (saved === "1") {
            setIsCollapsed(true);
        }
    }, []);

    useEffect(() => {
        const width = isCollapsed ? "92px" : "290px";
        document.documentElement.style.setProperty("--admin-sidebar-width", width);
        localStorage.setItem("admin_sidebar_collapsed", isCollapsed ? "1" : "0");
    }, [isCollapsed]);

    useEffect(() => {
        if (!sidebarRef.current || !navRef.current) return;

        gsap.fromTo(
            sidebarRef.current,
            {
                x: -18,
                opacity: 0,
            },
            {
                x: 0,
                opacity: 1,
                duration: 0.45,
                ease: "power3.out",
            }
        );

        gsap.fromTo(
            navRef.current.children,
            {
                x: -12,
                opacity: 0,
            },
            {
                x: 0,
                opacity: 1,
                duration: 0.35,
                stagger: 0.045,
                delay: 0.08,
                ease: "power3.out",
            }
        );
    }, [visibleNavItems.length]);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        const apiBase = process.env.NEXT_PUBLIC_PHP_API;

        if (!apiBase) {
            toast.error("API URL is not configured.");
            return;
        }

        setIsLoggingOut(true);

        try {
            const res = await fetch(`${apiBase}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "logout",
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid logout response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Logout failed.");
            }

            sessionStorage.clear();

            localStorage.removeItem("message_note_profile_active_tab");
            localStorage.removeItem("admin_sidebar_collapsed");

            toast.success(result.message || "Logged out successfully.");

            window.location.replace("/login");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while logging out.";

            console.error("Logout error:", error);
            toast.error(message);
            setIsLoggingOut(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="fixed left-4 top-4 z-[80] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/50 text-white backdrop-blur-xl transition hover:bg-white/10 md:hidden"
                aria-label="Open admin sidebar"
            >
                <BiMenu className="h-7 w-7"/>
            </button>

            {isMobileOpen && (
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm md:hidden"
                    aria-label="Close admin sidebar overlay"
                />
            )}

            <aside
                ref={sidebarRef}
                className={`
                    fixed left-0 top-0 z-[90]
                    h-screen
                    border-r border-white/10
                    bg-[#070912]/95
                    text-white shadow-2xl shadow-black/40
                    backdrop-blur-2xl
                    transition-all duration-300
                    md:translate-x-0
                    ${isCollapsed ? "md:w-[92px] md:px-3" : "md:w-[290px] md:px-4"}
                    ${isMobileOpen ? "translate-x-0 w-[290px] px-4" : "-translate-x-full w-[290px] px-4"}
                    py-5
                `}
            >
                <div
                    className="pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full bg-violet-500/20 blur-[110px]"/>
                <div
                    className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-500/[0.08] blur-[120px]"/>

                <div className="relative z-10 flex h-full flex-col">
                    <div
                        className={`mb-7 flex items-center ${
                            isCollapsed ? "md:justify-center" : "justify-between"
                        }`}
                    >
                        <Link
                            href={currentUser.role === "support" ? "/admin/tickets" : "/admin"}
                            className="group block"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xl font-black text-white shadow-lg shadow-violet-500/30 transition-transform duration-300 group-hover:scale-105">
                                    <span className="relative z-10">MN</span>
                                    <span
                                        className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"/>
                                </div>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
                                    }`}
                                >
                                    <h2 className="whitespace-nowrap text-lg font-black tracking-tight text-white">
                                        Message Note
                                    </h2>

                                    <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                                        {currentUser.role === "support"
                                            ? "Support Panel"
                                            : "Admin Control"}
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white md:hidden"
                            aria-label="Close admin sidebar"
                        >
                            <BiX className="h-6 w-6"/>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed((prev) => !prev)}
                        className="absolute -right-4 top-20 z-20 hidden h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1020] text-white/60 shadow-xl shadow-black/30 transition hover:border-violet-400/40 hover:bg-violet-500 hover:text-white md:flex"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
                            <BiChevronRight className="h-6 w-6"/>
                        ) : (
                            <BiChevronLeft className="h-6 w-6"/>
                        )}
                    </button>

                    <nav
                        ref={navRef}
                        className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pr-1"
                    >
                        {visibleNavItems.map((item) => {
                            const active = isActivePath(pathname, item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={item.label}
                                    className={`
                                        group relative flex items-center overflow-hidden
                                        rounded-2xl
                                        text-sm font-black
                                        transition
                                        ${
                                        isCollapsed
                                            ? "md:justify-center md:px-2 md:py-3.5"
                                            : "gap-3 px-4 py-3.5"
                                    }
                                        ${
                                        active
                                            ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                                            : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                                    }
                                    `}
                                >
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1/2 h-3/5 w-[3px] -translate-y-1/2 rounded-r-full bg-white/70"/>
                                    )}

                                    <span
                                        className={`
                                            flex h-10 w-10 shrink-0 items-center justify-center
                                            rounded-2xl text-2xl transition
                                            ${
                                            active
                                                ? "bg-white/15 text-white"
                                                : "bg-white/[0.04] text-white/45 group-hover:bg-white/10 group-hover:text-white"
                                        }
                                        `}
                                    >
                                        {item.icon}
                                    </span>

                                    <span
                                        className={`
                                            min-w-0 flex-1 truncate transition-all duration-300
                                            ${isCollapsed ? "md:w-0 md:flex-none md:opacity-0" : "opacity-100"}
                                        `}
                                    >
                                        {item.label}
                                    </span>

                                    {item.badge && !isCollapsed && (
                                        <span
                                            className={`
                                                rounded-full px-2.5 py-1
                                                text-[9px] font-black uppercase tracking-wider
                                                ${
                                                active
                                                    ? "bg-white/15 text-white"
                                                    : "bg-cyan-400/10 text-cyan-300"
                                            }
                                            `}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-5 border-t border-white/10 pt-5">
                        <div
                            className={`mb-4 flex items-center rounded-3xl border border-white/10 bg-white/[0.035] p-3 ${
                                isCollapsed ? "md:justify-center" : "gap-3"
                            }`}
                        >
                            <div
                                className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 text-lg font-black text-white">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiLockAlt className="h-5 w-5"/>
                                )}
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#070912] bg-emerald-400"/>
                            </div>

                            <div
                                className={`min-w-0 flex-1 overflow-hidden transition-all duration-300 ${
                                    isCollapsed ? "md:w-0 md:flex-none md:opacity-0" : "opacity-100"
                                }`}
                            >
                                <p className="truncate text-sm font-black text-white">
                                    {currentUser.role === "admin"
                                        ? "Admin Access"
                                        : "Support Access"}
                                </p>

                                <p className="truncate text-xs font-bold text-white/35">
                                    {currentUser.role === "admin"
                                        ? "Full management panel"
                                        : "Tickets only"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            title="Logout"
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <BiLogOut className="h-5 w-5 shrink-0"/>

                            <span
                                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                                    isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
                                }`}
                            >
                                {isLoggingOut ? "Logging out..." : "Logout"}
                            </span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}