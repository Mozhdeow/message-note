"use client";

import React, {useEffect, useRef, useState} from "react";
import {
    BiBell,
    BiBookOpen,
    BiChevronDown,
    BiLogOut,
    BiMenu,
    BiPlus,
    BiShield,
    BiSolidPlaylist,
    BiUser,
    BiX,
} from "react-icons/bi";
import {BsArrowUpRight} from "react-icons/bs";
import Link from "next/link";
import {HoverStaggerLink} from "@/components/HoverStaggerLink";
import {useUser} from "@/hooks/useUser";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import Image from "next/image";

const publicMenus = [
    {
        title: "Home",
        url: "/",
        icon: <BiBookOpen/>,
    },
    {
        title: "Playlists",
        icon: <BiSolidPlaylist/>,
        items: [
            {
                title: "Explore Playlists",
                description: "See public and sample playlists",
                icon: BiSolidPlaylist,
                url: "/dashboard/profile?tab=opened-playlists",
            },
            {
                title: "Create Playlist",
                description: "Make a private music playlist",
                icon: BiPlus,
                url: "/dashboard/profile?tab=create-playlist",
            },
        ],
    },
    {
        title: "About",
        url: "/about-us",
        icon: <BiBookOpen/>,
    },
    {
        title: "Support",
        url: "/dashboard/profile?tab=ticket",
        icon: <BiBookOpen/>,
    },
];

export const DEFAULT_AVATAR = "/images/avatar.png";


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

function AvatarImage({
                         src,
                         alt,
                         className,
                     }: {
    src: string;
    alt: string;
    className: string;
}) {
    const [currentSrc, setCurrentSrc] = useState(src);

    useEffect(() => {
        setCurrentSrc(src);
    }, [src]);

    return (
        <img
            src={currentSrc}
            alt={alt}
            onError={() => {
                if (currentSrc !== DEFAULT_AVATAR) {
                    setCurrentSrc(DEFAULT_AVATAR);
                }
            }}
            className={className}
        />
    );
}

export default function Header() {
    const {user, isLoading} = useUser();

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isLoggedIn = Boolean(user?.isLoggedIn);
    const canOpenPanel = user?.role === "admin" || user?.role === "support";

    const avatarSrc = getAvatarUrl(user?.avatar)

    const userDisplayName = user?.username || user?.email || "User";

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setActiveMenu(null);
                setIsProfileOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuClick = (menu: string) => {
        setActiveMenu((prev) => (prev === menu ? null : menu));
        setIsProfileOpen(false);
    };

    const closeAllMenus = () => {
        setActiveMenu(null);
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
    };



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
        <header
            className="fixed left-0 right-0 top-0 z-50 px-4 py-5 transition-all duration-300 bg-gradient-to-b from-background/75 via-background/60 to-background md:px-8">
            <div
                ref={containerRef}
                className="mx-auto flex max-w-7xl items-center justify-between"
            >
                <Link href="/" className="flex flex-col items-start select-none">
                    <div className="flex items-center gap-1">
            <span
                className="font-display bg-gradient-to-r from-primary via-third to-secondary bg-clip-text text-2xl font-black tracking-tighter text-transparent md:text-3xl">
              Message
            </span>

                        <span
                            className="font-sans bg-gradient-to-r from-secondary to-primary bg-clip-text text-2xl font-light text-transparent md:text-3xl">
              Note
            </span>
                    </div>

                    <span
                        className="mt-[2px] whitespace-nowrap text-[8px] font-light uppercase leading-none tracking-[0.25em] text-white/45 md:text-[9px]">
            Share music with a private note
          </span>
                </Link>

                <nav className="hidden items-center lg:flex">
                    <div
                        className="flex items-center rounded-full border border-white/[0.08] bg-background/10 px-2.5 py-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md
                        transition hover:bg-secondary-background/20">
                        {publicMenus.map((menuName) => {
                            const isOpen = activeMenu === menuName.title;

                            return (
                                <div key={menuName.title} className="relative text-sm font-medium">
                                    {menuName.items ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleMenuClick(menuName.title)}
                                                className={`flex cursor-pointer items-center space-x-1 rounded-full px-4 py-1.5 transition-all duration-200 ${
                                                    isOpen
                                                        ? "bg-white/10 text-white"
                                                        : "text-neutral-300 hover:bg-white/[0.04] hover:text-white"
                                                }`}
                                            >
                                                <HoverStaggerLink label={menuName.title}/>

                                                <BiChevronDown
                                                    className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-300 ${
                                                        isOpen ? "rotate-180 text-white" : ""
                                                    }`}
                                                />
                                            </button>

                                            {isOpen && (
                                                <div
                                                    className="absolute left-1/2 mt-3 w-80 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-background/80
                                                    via-background/70 to-background p-4 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                                                    <div className="space-y-1">
                                                        {menuName.items.map((item) => {
                                                            const IconComponent = item.icon;

                                                            return (
                                                                <Link
                                                                    href={item.url}
                                                                    key={item.title}
                                                                    onClick={closeAllMenus}
                                                                    className="group flex w-full cursor-pointer items-start space-x-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
                                                                >
                                                                    <div
                                                                        className="rounded-md bg-white/5 p-1.5 transition-colors group-hover:bg-white/10">
                                                                        <IconComponent
                                                                            className="h-4 w-4 text-neutral-300 group-hover:text-white"/>
                                                                    </div>

                                                                    <div>
                                                                        <div
                                                                            className="flex items-center text-sm font-semibold text-white">
                                                                            {item.title}
                                                                            <BsArrowUpRight
                                                                                className="ml-1 h-2.5 w-2.5 text-primary opacity-0 transition-opacity group-hover:opacity-100"/>
                                                                        </div>

                                                                        <div
                                                                            className="mt-0.5 text-xs leading-normal text-neutral-400">
                                                                            {item.description}
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <HoverStaggerLink
                                            label={menuName.title}
                                            href={menuName.url}
                                            className="rounded-full px-4 py-1.5 text-neutral-300 hover:bg-white/[0.04] hover:text-white"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                <div className="hidden items-center space-x-5 lg:flex">
                    {!isLoading &&
                        (isLoggedIn ? (
                            <>

                                <Link
                                    href="/dashboard/profile?tab=create-playlist"
                                    className="rounded-full bg-white px-6 py-2 text-[12px] font-bold uppercase tracking-wider text-black! shadow-[0_4px_12px_rgba(255,255,255,0.15)]
                                    transition-all hover:bg-neutral-200 active:scale-95"
                                >
                                    Create Playlist
                                </Link>

                                {canOpenPanel && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[12px] font-bold uppercase tracking-wider
                                         text-primary transition hover:bg-primary/20"
                                    >
                                        <BiShield className="h-4 w-4"/>
                                        Panel
                                    </Link>
                                )}

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsProfileOpen((prev) => !prev);
                                            setActiveMenu(null);
                                        }}
                                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 pr-4 transition hover:bg-white/10"
                                    >
                                        <AvatarImage
                                            src={avatarSrc}
                                            alt={userDisplayName}
                                            className="block h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover"
                                        />

                                        <span className="max-w-28 truncate text-[12px] font-bold text-white">
                      {userDisplayName}
                    </span>

                                        <BiChevronDown
                                            className={`h-4 w-4 text-white/60 transition ${
                                                isProfileOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    {isProfileOpen && (
                                        <div
                                            className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 p-3
                                            shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)]
                                             backdrop-blur-xl">

                                            <Link
                                                href="/dashboard/profile?tab=overview"
                                                onClick={closeAllMenus}
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                                            >
                                                <BiUser className="h-5 w-5 text-white/60"/>
                                                Profile
                                            </Link>

                                            <Link
                                                href="/dashboard/profile?tab=my-playlists"
                                                onClick={closeAllMenus}
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                                            >
                                                <BiSolidPlaylist className="h-5 w-5 text-white/60"/>
                                                My Playlists
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-400 transition
                                                 hover:bg-red-500/10"
                                            >
                                                <BiLogOut className="h-5 w-5"/>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login?form=login"
                                    className="group flex items-center text-sm font-medium tracking-wide text-white transition-colors hover:text-neutral-200"
                                >
                                    <span className="font-semibold uppercase">Login</span>

                                    <span
                                        className="ml-1 inline-flex items-center text-primary transition-transform group-hover:translate-x-[2px] group-hover:-translate-y-[2px]">
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                      <line x1="7" y1="17" x2="17" y2="7"/>
                      <polyline points="7 7 17 7 17 17"/>
                    </svg>
                  </span>
                                </Link>

                                <Link
                                    href="/login?form=register"
                                    className="rounded-full bg-white px-6 py-2 text-[12px] font-bold uppercase tracking-wider  shadow-[0_4px_12px_rgba(255,255,255,0.15)] text-background!
                                    transition-all hover:bg-neutral-200 active:scale-95">
                                    Get Started
                                </Link>
                            </>
                        ))}
                </div>

                <div className="flex items-center space-x-3 lg:hidden">
                    {!isLoading && !isLoggedIn && (
                        <Link
                            href="/login?form=login"
                            className="rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black"
                        >
                            Login
                        </Link>
                    )}

                    {!isLoading && isLoggedIn && (
                        <Link
                            href="/dashboard/profile?tab=create-playlist"
                            className="rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black"
                        >
                            Create
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white"
                    >
                        {isMobileMenuOpen ? (
                            <BiX className="h-4 w-4"/>
                        ) : (
                            <BiMenu className="h-4 w-4"/>
                        )}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div
                    className="absolute left-0 right-0 top-[74px] max-h-[calc(100vh-80px)] overflow-y-auto border-b border-white/10 bg-gradient-to-b from-neutral-950 to-black px-5 py-6
                     shadow-2xl lg:hidden">
                    <div className="space-y-6">
                        {isLoggedIn && (
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                                <AvatarImage
                                    src={avatarSrc}
                                    alt={userDisplayName}
                                    className="block h-12 w-12 shrink-0 rounded-full border border-white/20 object-cover"
                                />

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-white">
                                        {userDisplayName}
                                    </p>

                                    <p className="text-sm uppercase text-white/40">{user?.role}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {publicMenus.map((menuName) => (
                                <div key={menuName.title} className="border-b border-white/5 pb-4">
                                    {menuName.items ? (
                                        <>
                                            <h3 className="mb-2.5 flex items-center space-x-1.5  font-bold uppercase tracking-wider text-neutral-400">
                                                <span>{menuName.title}</span>
                                            </h3>

                                            <div className="grid grid-cols-1 gap-3 pl-1.5 sm:grid-cols-2">
                                                {menuName.items.map((item) => {
                                                    const IconComponent = item.icon;

                                                    return (
                                                        <Link
                                                            key={item.title}
                                                            href={item.url}
                                                            onClick={closeAllMenus}
                                                            className="flex items-center space-x-3 py-1 text-left text-white hover:text-neutral-300"
                                                        >
                                                            <div className="rounded bg-white/5 p-1 px-1.5">
                                                                <IconComponent
                                                                    className="h-3.5 w-3.5 text-neutral-400"/>
                                                            </div>

                                                            <div>
                                <span className="block text-sm font-semibold">
                                  {item.title}
                                </span>
                                                                <span
                                                                    className="line-clamp-1 text-[9.5px] text-neutral-400">
                                  {item.description}
                                </span>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <Link
                                            href={menuName.url}
                                            onClick={closeAllMenus}
                                            className="flex items-center justify-between rounded-xl p-2 text-white transition hover:bg-white/5"
                                        >
                      <span className="text-[13px] font-bold uppercase tracking-wider">
                        {menuName.title}
                      </span>

                                            <BsArrowUpRight className="h-3.5 w-3.5 text-primary"/>
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!isLoading &&
                            (isLoggedIn ? (
                                <div className="flex flex-col space-y-3 pt-2">
                                    <Link
                                        href="/dashboard"
                                        onClick={closeAllMenus}
                                        className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-left"
                                    >
                    <span className="text-[12px] font-semibold tracking-wider text-white">
                      Dashboard
                    </span>
                                        <BsArrowUpRight className="h-3.5 w-3.5 text-primary"/>
                                    </Link>

                                    <Link
                                        href="/dashboard/profile"
                                        onClick={closeAllMenus}
                                        className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-left"
                                    >
                    <span className="text-[12px] font-semibold tracking-wider text-white">
                      Profile
                    </span>
                                        <BsArrowUpRight className="h-3.5 w-3.5 text-primary"/>
                                    </Link>

                                    <Link
                                        href="/dashboard/notifications"
                                        onClick={closeAllMenus}
                                        className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-left"
                                    >
                    <span className="text-[12px] font-semibold tracking-wider text-white">
                      Notifications
                    </span>
                                        <BsArrowUpRight className="h-3.5 w-3.5 text-primary"/>
                                    </Link>

                                    {canOpenPanel && (
                                        <Link
                                            href="/admin"
                                            onClick={closeAllMenus}
                                            className="flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/10 p-3 text-left"
                                        >
                      <span className="text-[12px] font-bold tracking-wider text-primary">
                        Admin Panel
                      </span>
                                            <BiShield className="h-4 w-4 text-primary"/>
                                        </Link>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-600/10 p-3 text-left"
                                    >
                    <span className="text-[12px] font-bold tracking-wider text-red-500">
                      Logout
                    </span>
                                        <BiLogOut className="h-4 w-4 text-red-500"/>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-3 pt-2">
                                    <Link
                                        href="/login?form=login"
                                        onClick={closeAllMenus}
                                        className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-left"
                                    >
                    <span className="text-[12px] font-semibold tracking-wider text-white">
                      Login
                    </span>
                                        <BsArrowUpRight className="h-3.5 w-3.5 text-primary"/>
                                    </Link>

                                    <Link
                                        href="/register"
                                        onClick={closeAllMenus}
                                        className="flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/10 p-3 text-left"
                                    >
                    <span className="text-[12px] font-bold tracking-wider text-primary">
                      Create Account
                    </span>
                                        <BsArrowUpRight className="h-3.5 w-3.5 text-primary"/>
                                    </Link>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </header>
    );
}