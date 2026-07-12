"use client";

import React, {useEffect, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";

import {useUser} from "@/hooks/useUser";
import ProfileBackground from "../partials/ProfileBackground";
import ProfilePanel from "../partials/ProfilePanel";
import {ProfileTab, ProfileUser} from "../partials/ProfileTypes";
import ProfileSidebar from "@/app/(site)/(user)/dashboard/partials/ProfileSidebar";

const PROFILE_TAB_STORAGE_KEY = "message_note_profile_active_tab";

const PROFILE_TABS: ProfileTab[] = [
    "overview",
    "edit-profile",
    "my-playlists",
    "create-playlist",
    "opened-playlists",
    "ticket",
];

const isValidProfileTab = (value: string | null): value is ProfileTab => {
    return Boolean(value && PROFILE_TABS.includes(value as ProfileTab));
};

const getInitialStoredTab = (): ProfileTab => {
    if (typeof window === "undefined") return "overview";

    const storedTab = localStorage.getItem(PROFILE_TAB_STORAGE_KEY);

    if (isValidProfileTab(storedTab)) {
        return storedTab;
    }

    return "overview";
};

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const {user, isLoading} = useUser();

    const [fallbackTab, setFallbackTab] = useState<ProfileTab>(getInitialStoredTab);
    const [updatedUser, setUpdatedUser] = useState<ProfileUser | null>(null);

    const urlTab = searchParams.get("tab");

    const activeTab = useMemo<ProfileTab>(() => {
        if (isValidProfileTab(urlTab)) {
            return urlTab;
        }

        return fallbackTab;
    }, [urlTab, fallbackTab]);

    const currentUser = useMemo<ProfileUser | null>(() => {
        if (updatedUser) return updatedUser;
        if (user) return user as ProfileUser;

        return null;
    }, [updatedUser, user]);

    useEffect(() => {
        localStorage.setItem(PROFILE_TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    const handleChangeTab = (tab: ProfileTab) => {
        setFallbackTab(tab);
        localStorage.setItem(PROFILE_TAB_STORAGE_KEY, tab);

        router.replace(`/dashboard/profile?tab=${tab}`, {
            scroll: false,
        });
    };

    const handleUserUpdated = (nextUser: ProfileUser) => {
        setUpdatedUser(nextUser);
    };

    if (isLoading || !currentUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-white">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-white">
            <ProfileBackground/>

            <main
                className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] px-4 pb-24 pt-28 md:px-8 lg:pl-28 lg:pr-10 lg:pt-32">
                <ProfileSidebar
                    user={currentUser}
                    activeTab={activeTab}
                    onChangeTab={handleChangeTab}
                />

                <ProfilePanel
                    user={currentUser}
                    activeTab={activeTab}
                    onUserUpdated={handleUserUpdated}
                />
            </main>
        </div>
    );
}