"use client";

import React, {useEffect, useState} from "react";
import {toast} from "sonner";
import {BiImageAdd, BiSave} from "react-icons/bi";

import type {ProfileUser} from "../ProfileTypes";
import ProfileSectionHeader from "../ProfileSectionHeader";
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

export default function EditProfilePanel({
                                             user,
                                             onUpdated,
                                         }: {
    user: ProfileUser;
    onUpdated: (user: ProfileUser) => void;
}) {
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFullName(user.full_name || "");
        setUsername(user.username || "");
        setEmail(user.email || "");
        setAvatarPreview(getAvatarUrl(user.avatar));
        setAvatarFile(null);
    }, [user.id, user.full_name, user.username, user.email, user.avatar]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

        if (!allowedTypes.includes(file.type)) {
            toast.error("Only JPG, PNG, WEBP or GIF images are allowed.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Avatar size must be less than 2MB.");
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedFullName = fullName.trim();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUsername) {
            toast.error("Username is required.");
            return;
        }

        if (trimmedUsername.length < 3) {
            toast.error("Username must be at least 3 characters.");
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            toast.error("Username can only contain letters, numbers and underscore.");
            return;
        }

        if (!trimmedEmail) {
            toast.error("Email is required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        const loadingToast = toast.loading("Updating profile...");

        try {
            const formData = new FormData();

            formData.append("action", "update_profile");
            formData.append("full_name", trimmedFullName);
            formData.append("username", trimmedUsername);
            formData.append("email", trimmedEmail);

            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_PHP_API}/process.php`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid profile update response:", text);

                toast.error("Server returned an invalid response.", {
                    id: loadingToast,
                });

                return;
            }

            if (result.success) {
                toast.success("Profile updated successfully.", {
                    id: loadingToast,
                });

                onUpdated(result.user);

                window.dispatchEvent(
                    new CustomEvent("message-note:user-updated", {
                        detail: result.user,
                    })
                );

                setAvatarFile(null);
                return;
            }
            const message =
                result.errors?.full_name ||
                result.errors?.username ||
                result.errors?.email ||
                result.errors?.avatar ||
                result.errors?.general ||
                result.message ||
                "Profile update failed.";

            toast.error(message, {
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
        <div>
            <ProfileSectionHeader
                eyebrow="Edit Profile"
                title="Update your profile"
                description="Your current account information is loaded here. Change anything you want and save it."
            />

            <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-md">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div className="relative h-28 w-28 shrink-0">
                            <div
                                className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/70 to-secondary/70 opacity-70 blur-md"/>

                            <img
                                src={avatarPreview}
                                alt="Avatar preview"
                                onError={(event) => {
                                    event.currentTarget.src = DEFAULT_AVATAR;
                                }}
                                className="relative h-full w-full rounded-[2rem] border border-white/20 object-cover"
                            />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-black text-white">Profile Avatar</h3>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                                Upload your avatar. Allowed formats are JPG, PNG, WEBP and GIF.
                                Maximum file size is 2MB.
                            </p>

                            <label
                                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/[0.12]">
                                <BiImageAdd className="h-5 w-5"/>
                                Choose Avatar

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                    disabled={loading}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/45">
                            Full Name
                        </label>

                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="input-login"
                            placeholder="Your full name"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/45">
                            Username
                        </label>

                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-login"
                            placeholder="Your username"
                            disabled={loading}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/45">
                            Email
                        </label>

                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-login"
                            placeholder="Your email"
                            type="email"
                            disabled={loading}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-submit flex w-fit items-center gap-2 bg-primary px-8 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading}
                >
                    <BiSave className="h-5 w-5"/>
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}