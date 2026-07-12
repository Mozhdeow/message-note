"use client";

import React, {useLayoutEffect, useRef, useState} from "react";
import gsap from "gsap";
import {
    BiEditAlt,
    BiGridAlt,
    BiLogOut,
    BiMusic,
    BiPlus,
    BiSolidPlaylist, BiSupport,
} from "react-icons/bi";

import type {ProfileTab, ProfileUser} from "./ProfileTypes";
import {toast} from "sonner";
import {DEFAULT_AVATAR} from "@/components/Header";

const getApiBase = () => {
    const apiBase = process.env.NEXT_PUBLIC_PHP_API || "";
    return apiBase.replace(/\/process\.php$/, "").replace(/\/$/, "");
};

const getAvatarUrl = (avatar?: string | null) => {
    if (!avatar) return DEFAULT_AVATAR;

    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
        return avatar;
    }

    if (avatar.startsWith("/images/") || avatar.startsWith("/default")) {
        return avatar;
    }

    const cleanAvatar = avatar.replace(/^\//, "");
    const apiBase = getApiBase();

    if (!apiBase) return DEFAULT_AVATAR;

    if (cleanAvatar.startsWith("actions/uploads/")) {
        const rootBase = apiBase.replace(/\/actions$/, "");
        return `${rootBase}/${cleanAvatar}`;
    }

    if (cleanAvatar.startsWith("uploads/")) {
        const actionsBase = apiBase.endsWith("/actions")
            ? apiBase
            : `${apiBase}/actions`;

        return `${actionsBase}/${cleanAvatar}`;
    }

    return `${apiBase}/${cleanAvatar}`;
};




const sidebarItems: {
    id: ProfileTab;
    title: string;
    description: string;
    icon: React.ElementType;
}[] = [
    {
        id: "overview",
        title: "Overview",
        description: "Profile summary",
        icon: BiGridAlt,
    },
    {
        id: "edit-profile",
        title: "Edit Profile",
        description: "Change your information",
        icon: BiEditAlt,
    },
    {
        id: "my-playlists",
        title: "My Playlists",
        description: "Playlists you created",
        icon: BiSolidPlaylist,
    },
    {
        id: "create-playlist",
        title: "Create Playlist",
        description: "Build a new playlist",
        icon: BiPlus,
    },
    {
        id: "opened-playlists",
        title: "Opened",
        description: "Playlists you unlocked",
        icon: BiMusic,
    },
    {
        id: "ticket",
        title: "Ticket",
        description: "Contact us",
        icon: BiSupport,
    },
    // {
    //     id: "notifications",
    //     title: "Notifications",
    //     description: "Your latest alerts",
    //     icon: BiBell,
    // },
];

export default function ProfileSidebar({
                                           user,
                                           activeTab,
                                           onChangeTab,
                                       }: {
    user: ProfileUser;
    activeTab: ProfileTab;
    onChangeTab: (tab: ProfileTab) => void;
}) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const sidebarRef = useRef<HTMLDivElement | null>(null);

    const avatarSrc = getAvatarUrl(user.avatar);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from("[data-sidebar='shell']", {
                x: -24,
                opacity: 0,
                scale: 0.96,
                duration: 0.75,
                ease: "power4.out",
            });

            gsap.from("[data-sidebar='item']", {
                y: 14,
                opacity: 0,
                duration: 0.45,
                stagger: 0.055,
                ease: "power3.out",
                delay: 0.18,
            });
        }, sidebarRef);

        return () => ctx.revert();
    }, []);


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

            toast.success(result.message || "Logged out successfully.");

            window.location.replace("/login");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while logging out.";

            console.error("Logout error:", error);
            toast.error(message);
        } finally {
            setIsLoggingOut(false);
        }
    };
    return (
        <>
            <aside
                ref={sidebarRef}
                className="pointer-events-none fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
            >
                <div
                    data-sidebar="shell"
                    className="pointer-events-auto flex flex-col items-center gap-3 rounded-[2rem] border border-white/15 bg-white/[0.10] px-3 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)]
                     backdrop-blur-2xl"
                >
                    <div
                        data-sidebar="item"
                        className="relative mb-1 h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-white/10"
                    >
                        <img
                            src={avatarSrc}
                            alt={user.username || "User avatar"}
                            onError={(event) => {
                                event.currentTarget.src = DEFAULT_AVATAR;
                            }}
                            className="block h-full w-full object-cover"
                        />
                    </div>

                    <div className="h-px w-8 bg-white/15"/>

                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                data-sidebar="item"
                                type="button"
                                onClick={() => onChangeTab(item.id)}
                                className="group relative flex h-12 w-12 items-center justify-center"
                            >
                <span
                    className={`absolute inset-0 rounded-full transition-all duration-300 ${
                        isActive
                            ? "bg-white/22 shadow-[0_0_25px_rgba(255,255,255,0.20)]"
                            : "bg-transparent group-hover:bg-white/14"
                    }`}
                />

                                <Icon
                                    className={`relative z-10 h-6 w-6 transition-all duration-300 ${
                                        isActive
                                            ? "text-white"
                                            : "text-white/65 group-hover:scale-110 group-hover:text-white"
                                    }`}
                                />

                                <div
                                    className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 min-w-[190px] -translate-y-1/2 translate-x-3 rounded-2xl border border-white/10
                                     bg-white/[0.10] px-4 py-3 text-left opacity-0 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300
                                     group-hover:translate-x-0 group-hover:opacity-100">
                                    <p className="text-sm font-black text-white">{item.title}</p>
                                    <p className="mt-1 text-[11px] font-medium text-white/45">
                                        {item.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}

                    <div className="h-px w-8 bg-white/15"/>

                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        data-sidebar="item"
                        type="button"
                        className="group relative flex h-12 w-12 items-center justify-center"
                    >
                        <span
                            className="absolute inset-0 rounded-full transition-all duration-300 group-hover:bg-red-500/15"/>

                        <BiLogOut
                            className="relative z-10 h-6 w-6 text-white/55 transition-all duration-300 group-hover:scale-110 group-hover:text-red-400"/>

                        <div
                            className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 min-w-[150px] -translate-y-1/2 translate-x-3 rounded-2xl border border-red-500/15
                            bg-red-500/[0.10] px-4 py-3 text-left opacity-0 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 group-hover:translate-x-0
                            group-hover:opacity-100">
                            <p className="text-sm font-black text-red-300">Logout</p>
                            <p className="mt-1 text-[11px] font-medium text-white/40">
                                Exit your account
                            </p>
                        </div>
                    </button>
                </div>
            </aside>

            <nav
                className="fixed bottom-4 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 grid-cols-6 items-center rounded-[2rem] border border-white/15
                bg-white/[0.10] px-3 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:hidden"
            >
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onChangeTab(item.id)}
                            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                                isActive ? "bg-white/22 text-white" : "text-white/60"
                            }`}
                        >
                            <Icon className="h-6 w-6"/>
                        </button>
                    );
                })}
            </nav>
        </>
    );
}