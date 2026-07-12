"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

import type { ProfileTab, ProfileUser } from "./ProfileTypes";

import OverviewPanel from "./sections/OverviewPanel";
import EditProfilePanel from "@/app/(site)/(user)/dashboard/partials/sections/EditProfilePanel";
import CreatePersonalPlaylist from "./sections/CreatePersonalPlaylist";
import MyPlaylistsPanel from "@/app/(site)/(user)/dashboard/partials/sections/MyPlaylistsPanel";
import OpenedPlaylistsPanel from "@/app/(site)/(user)/dashboard/partials/sections/OpenedPlaylistsPanel";
import TicketPanel from "@/app/(site)/(user)/dashboard/partials/sections/TicketPanel";

export default function ProfilePanel({
                                         user,
                                         activeTab,
                                         onUserUpdated,
                                     }: {
    user: ProfileUser;
    activeTab: ProfileTab;
    onUserUpdated: (user: ProfileUser) => void;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (!panelRef.current) return;

        gsap.killTweensOf(panelRef.current);

        gsap.fromTo(
            panelRef.current,
            {
                y: 20,
                opacity: 0,
                scale: 0.99,
            },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.35,
                ease: "power3.out",
                clearProps: "transform,opacity",
            }
        );
    }, [activeTab]);

    return (
        <section className="flex w-full flex-1 justify-end">
            <div
                ref={panelRef}
                data-profile="panel"
                className="
                    relative
                    w-full
                    overflow-hidden
                    rounded-[2rem]
                    border border-white/10
                    bg-gradient-to-r from-background/20 via-background/20 to-primary/10
                    p-5
                    opacity-100
                    shadow-[0_24px_70px_rgba(0,0,0,0.20)]
                    backdrop-blur-md
                    md:p-7
                    lg:mt-4
                "
            >
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-[90px]" />
                <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-secondary/8 blur-[100px]" />

                <div className="relative z-10">
                    {activeTab === "overview" && <OverviewPanel user={user} />}

                    {activeTab === "edit-profile" && (
                        <EditProfilePanel user={user} onUpdated={onUserUpdated} />
                    )}

                    {activeTab === "my-playlists" && <MyPlaylistsPanel />}

                    {activeTab === "create-playlist" && <CreatePersonalPlaylist />}

                    {activeTab === "opened-playlists" && <OpenedPlaylistsPanel />}

                    {activeTab === "ticket" && <TicketPanel />}
                </div>
            </div>
        </section>
    );
}