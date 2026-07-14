"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {toast} from "sonner";
import {
    BiCopy, BiEdit,
    BiImage, BiKey,
    BiLinkExternal,
    BiPlus,
    BiSolidPlaylist, BiTrash,
} from "react-icons/bi";

import GlassCard from "../GlassCard";
import ProfileSectionHeader from "../ProfileSectionHeader";
import { createPortal } from "react-dom";

type UserPlaylist = {
    id: number;
    title: string;
    receiver_name?: string | null;
    receiver_message?: string | null;
    cover_image?: string | null;
    share_token: string;
    share_url?: string;
    created_at: string;
    categories_count: number;
    tracks_count: number;
    has_main_track: boolean;
    is_active?: number | boolean;
    main_track_name?: string | null;
    main_artist_name?: string | null;
    main_album_name?: string | null;
    main_lyrics?: string | null;
    main_description?: string | null;
    main_duration?: number | string | null;
    main_file_url?: string | null;
    main_cover_image?: string | null;
};

const getPlaylistPath = (token: string) => {
    return `/playlist/${encodeURIComponent(token)}`;
};

const getPlaylistFullUrl = (token: string) => {
    if (typeof window === "undefined") {
        return getPlaylistPath(token);
    }

    return `${window.location.origin}${getPlaylistPath(token)}`;
};

const getImageUrl = (url?: string | null) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || "";
    const cleanBase = apiBase.replace(/\/$/, "");
    const cleanUrl = url.replace(/^\//, "");

    if (!cleanBase) {
        return `/${cleanUrl}`;
    }

    return `${cleanBase}/${cleanUrl}`;
};

const getFileNameFromUrl = (url?: string | null) => {
    if (!url) return "";

    try {
        const cleanUrl = url.split("?")[0];
        const parts = cleanUrl.split("/");
        return decodeURIComponent(parts[parts.length - 1] || "");
    } catch {
        return url;
    }
};

export default function MyPlaylistsPanel() {
    const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState<{
        open: boolean;
        playlist: UserPlaylist | null;
    }>({
        open: false,
        playlist: null,
    });

    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        playlist: UserPlaylist | null;
    }>({
        open: false,
        playlist: null,
    });

    const [editTitle, setEditTitle] = useState("");
    const [editReceiverName, setEditReceiverName] = useState("");
    const [editReceiverMessage, setEditReceiverMessage] = useState("");
    const [editIsActive, setEditIsActive] = useState(true);
    const [editPlaylistCover, setEditPlaylistCover] = useState<File | null>(null);
    const [editMainTrackFile, setEditMainTrackFile] = useState<File | null>(null);
    const [editMainTrackCover, setEditMainTrackCover] = useState<File | null>(null);
    const [editMainTrackName, setEditMainTrackName] = useState("");
    const [editMainArtistName, setEditMainArtistName] = useState("");
    const [editMainAlbumName, setEditMainAlbumName] = useState("");
    const [editMainLyrics, setEditMainLyrics] = useState("");
    const [editMainDescription, setEditMainDescription] = useState("");
    const [editMainDuration, setEditMainDuration] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [passwordModal, setPasswordModal] = useState<{
        open: boolean;
        playlist: UserPlaylist | null;
    }>({
        open: false,
        playlist: null,
    });

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const openPasswordModal = (playlist: UserPlaylist) => {
        setPasswordModal({
            open: true,
            playlist,
        });
        setNewPassword("");
        setConfirmPassword("");
    };

    const closePasswordModal = () => {
        setPasswordModal({
            open: false,
            playlist: null,
        });
        setNewPassword("");
        setConfirmPassword("");
    };

    const changePlaylistPassword = async () => {
        if (!passwordModal.playlist) return;

        if (!newPassword.trim()) {
            toast.error("New password is required.");
            return;
        }

        if (newPassword.length < 4) {
            toast.error("Password must be at least 4 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setChangingPassword(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "change_my_playlist_password",
                    playlist_id: String(passwordModal.playlist.id),
                    password: newPassword,
                    confirm_password: confirmPassword,
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid change password response:", text);
                toast.error("Server returned an invalid response.");
                return;
            }

            if (!result.success) {
                toast.error(result.message || "Could not change password.");
                return;
            }

            toast.success(result.message || "Password changed successfully.");
            closePasswordModal();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while changing password.");
        } finally {
            setChangingPassword(false);
        }
    };

    const openEditModal = (playlist: UserPlaylist) => {
        setEditModal({
            open: true,
            playlist,
        });

        setEditTitle(playlist.title || "");
        setEditReceiverName(playlist.receiver_name || "");
        setEditReceiverMessage(playlist.receiver_message || "");
        setEditIsActive(Boolean(playlist.is_active ?? true));
        setEditPlaylistCover(null);
        setEditMainTrackFile(null);
        setEditMainTrackCover(null);
        setEditMainTrackName(playlist.main_track_name || "");
        setEditMainArtistName(playlist.main_artist_name || "");
        setEditMainAlbumName(playlist.main_album_name || "");
        setEditMainLyrics(playlist.main_lyrics || "");
        setEditMainDescription(playlist.main_description || "");
        setEditMainDuration(playlist.main_duration ? String(playlist.main_duration) : "");
    };

    const closeEditModal = () => {
        setEditModal({
            open: false,
            playlist: null,
        });

        setEditTitle("");
        setEditReceiverName("");
        setEditReceiverMessage("");
        setEditIsActive(true);
        setEditPlaylistCover(null);
        setEditMainTrackFile(null);
        setEditMainTrackCover(null);
        setEditMainTrackName("");
        setEditMainArtistName("");
        setEditMainAlbumName("");
        setEditMainLyrics("");
        setEditMainDescription("");
        setEditMainDuration("");
    };

    const openDeleteModal = (playlist: UserPlaylist) => {
        setDeleteModal({
            open: true,
            playlist,
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({
            open: false,
            playlist: null,
        });
    };

    const updatePlaylist = async () => {
        if (!editModal.playlist) return;

        if (!editTitle.trim()) {
            toast.error("Playlist title is required.");
            return;
        }

        setSavingEdit(true);

        try {
            const formData = new FormData();

            formData.append("action", "update_my_playlist");
            formData.append("playlist_id", String(editModal.playlist.id));
            formData.append("title", editTitle);
            formData.append("receiver_name", editReceiverName);
            formData.append("receiver_message", editReceiverMessage);
            formData.append("is_active", editIsActive ? "1" : "0");
            formData.append("main_track_name", editMainTrackName);
            formData.append("main_artist_name", editMainArtistName);
            formData.append("main_album_name", editMainAlbumName);
            formData.append("main_lyrics", editMainLyrics);
            formData.append("main_description", editMainDescription);
            formData.append("main_duration", editMainDuration);

            if (editPlaylistCover instanceof File) {
                formData.append("cover_image", editPlaylistCover);
            }

            if (editMainTrackFile instanceof File) {
                formData.append("main_track_file", editMainTrackFile);
            }

            if (editMainTrackCover instanceof File) {
                formData.append("main_track_cover", editMainTrackCover);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid update playlist response:", text);
                toast.error("Server returned an invalid response.");
                return;
            }

            if (!result.success) {
                toast.error(result.message || "Could not update playlist.");
                return;
            }

            toast.success(result.message || "Playlist updated successfully.");
            closeEditModal();
            loadPlaylists();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while updating playlist.");
        } finally {
            setSavingEdit(false);
        }
    };


    const deletePlaylist = async () => {
        if (!deleteModal.playlist) return;

        setDeleting(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "delete_my_playlist",
                    playlist_id: String(deleteModal.playlist.id),
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid delete playlist response:", text);
                toast.error("Server returned an invalid response.");
                return;
            }

            if (!result.success) {
                toast.error(result.message || "Could not delete playlist.");
                return;
            }

            toast.success(result.message || "Playlist deleted successfully.");
            closeDeleteModal();
            loadPlaylists();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while deleting playlist.");
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
        setLoading(true);

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
                        action: "get_my_playlists",
                    }).toString(),
                }
            );

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid playlists response:", text);
                toast.error("Server returned an invalid response.");
                return;
            }

            if (!result.success) {
                toast.error(result.message || "Could not load playlists.");
                return;
            }

            setPlaylists(result.playlists || []);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while loading playlists.");
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async (token: string) => {
        try {
            const url = getPlaylistFullUrl(token);

            await navigator.clipboard.writeText(url);
            toast.success("Playlist link copied.");
        } catch {
            toast.error("Could not copy link.");
        }
    };

    return (
        <div>
            <ProfileSectionHeader
                eyebrow="My Playlists"
                title="Your music notes"
                description="These are the private playlists you created and shared with password protection."
            />

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-white/45">
                        {loading
                            ? "Loading playlists..."
                            : `${playlists.length} playlist${
                                playlists.length === 1 ? "" : "s"
                            } found`}
                    </p>
                </div>

                <Link
                    href="/dashboard/profile?tab=create-playlist"
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black! transition hover:bg-primary
                    hover:text-white!"
                >
                    <BiPlus className="h-5 w-5"/>
                    Create Playlist
                </Link>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <PlaylistSkeleton/>
                    <PlaylistSkeleton/>
                    <PlaylistSkeleton/>
                    <PlaylistSkeleton/>
                </div>
            ) : playlists.length === 0 ? (
                <GlassCard>
                    <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                        <div
                            className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                            <BiSolidPlaylist className="h-9 w-9"/>
                        </div>

                        <h3 className="text-2xl font-black text-white">
                            No playlists yet.
                        </h3>

                        <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
                            Create your first private playlist, choose a main music,
                            add categories and share it with a password.
                        </p>

                        <Link
                            href="/dashboard/profile?tab=create-playlist"
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-secondary"
                        >
                            <BiPlus className="h-5 w-5"/>
                            Start Creating
                        </Link>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {playlists.map((playlist) => (
                        <PlaylistCard
                            key={playlist.id}
                            playlist={playlist}
                            onCopy={copyLink}
                            onEdit={openEditModal}
                            onChangePassword={openPasswordModal}
                            onDelete={openDeleteModal}
                        />
                    ))}
                </div>
            )}

            {passwordModal.open && passwordModal.playlist && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11111a] p-6 shadow-2xl">
                        <h3 className="text-2xl font-black text-white">
                            Change Password
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-white/45">
                            Set a new password for {passwordModal.playlist.title}.
                        </p>

                        <div className="mt-6 space-y-4">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder="New password"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                            />

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Confirm new password"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                disabled={changingPassword}
                                className="rounded-full border border-white/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/60 transition hover:bg-white/10 hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={changePlaylistPassword}
                                disabled={changingPassword}
                                className="rounded-full bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {changingPassword ? "Saving..." : "Save Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {editModal.open &&
                editModal.playlist &&
                typeof document !== "undefined" &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] bg-black/80 px-4 py-6 backdrop-blur-md">
                        <div className="mx-auto flex min-h-full w-full items-start justify-center">
                            <div className="flex max-h-[calc(100vh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11111a] shadow-2xl">
                                <div className="shrink-0 border-b border-white/10 p-6">
                                    <h3 className="text-2xl font-black text-white">
                                        Edit Playlist
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-white/45">
                                        Update your playlist details, cover image and main song.
                                    </p>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(event) => setEditTitle(event.target.value)}
                                            placeholder="Playlist title"
                                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                        />

                                        <input
                                            type="text"
                                            value={editReceiverName}
                                            onChange={(event) => setEditReceiverName(event.target.value)}
                                            placeholder="Receiver name"
                                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                        />

                                        <textarea
                                            value={editReceiverMessage}
                                            onChange={(event) => setEditReceiverMessage(event.target.value)}
                                            placeholder="Receiver message"
                                            rows={4}
                                            className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                        />

                                        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                                <span className="text-sm font-bold text-white/70">
                                    Playlist is active
                                </span>

                                            <input
                                                type="checkbox"
                                                checked={editIsActive}
                                                onChange={(event) => setEditIsActive(event.target.checked)}
                                                className="h-5 w-5 accent-primary"
                                            />
                                        </label>

                                        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4">
                                            <p className="mb-4 text-xs font-black uppercase tracking-wider text-white/35">
                                                Playlist Cover
                                            </p>

                                            {editModal.playlist.cover_image ? (
                                                <div className="mb-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                                                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                                        <img
                                                            src={getImageUrl(editModal.playlist.cover_image)}
                                                            alt={editModal.playlist.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black uppercase tracking-wider text-white/30">
                                                            Current cover
                                                        </p>

                                                        <p className="mt-1 truncate text-sm font-bold text-white/70">
                                                            {getFileNameFromUrl(editModal.playlist.cover_image)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/35">
                                                    No current playlist cover.
                                                </div>
                                            )}

                                            {editPlaylistCover && (
                                                <p className="mb-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-bold text-primary">
                                                    New selected cover: {editPlaylistCover.name}
                                                </p>
                                            )}

                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => setEditPlaylistCover(event.target.files?.[0] || null)}
                                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-black file:text-black"
                                            />
                                        </div>

                                        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4">
                                            <p className="mb-4 text-xs font-black uppercase tracking-wider text-white/35">
                                                Main Song
                                            </p>

                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    value={editMainTrackName}
                                                    onChange={(event) => setEditMainTrackName(event.target.value)}
                                                    placeholder="Main song title"
                                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                                />

                                                <input
                                                    type="text"
                                                    value={editMainArtistName}
                                                    onChange={(event) => setEditMainArtistName(event.target.value)}
                                                    placeholder="Artist name"
                                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                                />

                                                <input
                                                    type="text"
                                                    value={editMainAlbumName}
                                                    onChange={(event) => setEditMainAlbumName(event.target.value)}
                                                    placeholder="Album name"
                                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                                />

                                                <input
                                                    type="number"
                                                    value={editMainDuration}
                                                    onChange={(event) => setEditMainDuration(event.target.value)}
                                                    placeholder="Duration in seconds"
                                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                                />

                                                <textarea
                                                    value={editMainLyrics}
                                                    onChange={(event) => setEditMainLyrics(event.target.value)}
                                                    placeholder="Lyrics"
                                                    rows={3}
                                                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                                />

                                                <textarea
                                                    value={editMainDescription}
                                                    onChange={(event) => setEditMainDescription(event.target.value)}
                                                    placeholder="Description"
                                                    rows={3}
                                                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                                                />

                                                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                                                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-white/35">
                                                        Main song file
                                                    </p>

                                                    {editModal.playlist.main_file_url ? (
                                                        <p className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/60">
                                                            Current file: {getFileNameFromUrl(editModal.playlist.main_file_url)}
                                                        </p>
                                                    ) : (
                                                        <p className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/30">
                                                            No current main song file.
                                                        </p>
                                                    )}

                                                    {editMainTrackFile && (
                                                        <p className="mb-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-bold text-primary">
                                                            New selected song: {editMainTrackFile.name}
                                                        </p>
                                                    )}

                                                    <input
                                                        type="file"
                                                        accept="audio/*"
                                                        onChange={(event) => setEditMainTrackFile(event.target.files?.[0] || null)}
                                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-black file:text-black"
                                                    />
                                                </div>

                                                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                                                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-white/35">
                                                        Main song cover
                                                    </p>

                                                    {editModal.playlist.main_cover_image ? (
                                                        <div className="mb-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                                            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                                                <img
                                                                    src={getImageUrl(editModal.playlist.main_cover_image)}
                                                                    alt={editModal.playlist.main_track_name || "Main song cover"}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black uppercase tracking-wider text-white/30">
                                                                    Current main cover
                                                                </p>

                                                                <p className="mt-1 truncate text-sm font-bold text-white/70">
                                                                    {getFileNameFromUrl(editModal.playlist.main_cover_image)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/30">
                                                            No current main song cover.
                                                        </p>
                                                    )}

                                                    {editMainTrackCover && (
                                                        <p className="mb-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-bold text-primary">
                                                            New selected main cover: {editMainTrackCover.name}
                                                        </p>
                                                    )}

                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) => setEditMainTrackCover(event.target.files?.[0] || null)}
                                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-black file:text-black"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 border-t border-white/10 bg-[#11111a] p-5">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeEditModal}
                                            disabled={savingEdit}
                                            className="rounded-full border border-white/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/60 transition hover:bg-white/10 hover:text-white"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={updatePlaylist}
                                            disabled={savingEdit}
                                            className="rounded-full bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {savingEdit ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}


            {deleteModal.open && deleteModal.playlist && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-[#11111a] p-6 shadow-2xl">
                        <h3 className="text-2xl font-black text-red-300">
                            Delete Playlist
                        </h3>

                        <p className="mt-3 text-sm leading-7 text-white/55">
                            Are you sure you want to delete {deleteModal.playlist.title} ?
                            This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="rounded-full border border-white/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/60 transition hover:bg-white/10 hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deletePlaylist}
                                disabled={deleting}
                                className="rounded-full bg-red-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function PlaylistCard({
                          playlist,
                          onCopy,
                          onEdit,
                          onChangePassword,
                          onDelete,
                      }: {
    playlist: UserPlaylist;
    onCopy: (token: string) => void;
    onEdit: (playlist: UserPlaylist) => void;
    onChangePassword: (playlist: UserPlaylist) => void;
    onDelete: (playlist: UserPlaylist) => void;
}) {
    const date = playlist.created_at
        ? new Date(playlist.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "Unknown date";

    const playlistPath = getPlaylistPath(playlist.share_token);
    const coverUrl = getImageUrl(playlist.cover_image);

    return (
        <GlassCard className="group overflow-hidden transition hover:-translate-y-1 hover:bg-white/[0.05]">
            <div className="flex gap-4">
                <div
                    className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={playlist.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div
                            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-white/35">
                            <BiImage className="h-10 w-10"/>
                        </div>
                    )}

                    {playlist.has_main_track && (
                        <span
                            className="absolute left-2 top-2 rounded-full bg-cyan-400/90 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-black">
                            Main
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-black text-white">
                        {playlist.title}
                    </h3>

                    {playlist.receiver_name && (
                        <p className="mt-1 truncate text-sm font-bold text-primary">
                            For {playlist.receiver_name}
                        </p>
                    )}

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">
                        {playlist.receiver_message || "No personal message added."}
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/30">
                        Created {date}
                    </p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="Categories" value={playlist.categories_count}/>
                <MiniStat label="Tracks" value={playlist.tracks_count}/>
                <MiniStat label="Access" value="Locked"/>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <Link
                    href={playlistPath}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs! font-black uppercase tracking-wider text-black! transition hover:bg-primary
                     hover:text-white!"
                >
                    <BiLinkExternal className="h-4 w-4"/>
                    Open
                </Link>

                <button
                    type="button"
                    onClick={() => onCopy(playlist.share_token)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-primary/20 px-4 py-2 text-xs! font-black uppercase tracking-wider text-white/65
                    transition hover:bg-primary/30 hover:text-white"
                >
                    <BiCopy className="h-4 w-4"/>
                    Copy
                </button>
                <button
                    type="button"
                    onClick={() => onEdit(playlist)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs! font-black uppercase tracking-wider text-white/65 transition hover:bg-white/[0.09] hover:text-white"
                >
                    <BiEdit className="h-4 w-4"/>
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() => onChangePassword(playlist)}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs! font-black uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/20"
                >
                    <BiKey className="h-4 w-4"/>
                    Password
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(playlist)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs! font-black uppercase tracking-wider text-red-300
                     transition hover:bg-red-500/20"
                >
                    <BiTrash className="h-4 w-4"/>
                    Delete
                </button>
            </div>
        </GlassCard>
    );
}

function MiniStat({
                      label,
                      value,
                  }: {
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
            <p className="text-lg font-black text-white">{value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/30">
                {label}
            </p>
        </div>
    );
}

function PlaylistSkeleton() {
    return (
        <GlassCard>
            <div className="flex gap-4">
                <div className="h-28 w-28 shrink-0 animate-pulse rounded-3xl bg-white/10"/>

                <div className="flex-1">
                    <div className="h-6 w-2/3 animate-pulse rounded-xl bg-white/10"/>
                    <div className="mt-3 h-4 w-1/2 animate-pulse rounded-xl bg-white/10"/>
                    <div className="mt-4 h-4 w-full animate-pulse rounded-xl bg-white/10"/>
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded-xl bg-white/10"/>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="h-16 animate-pulse rounded-2xl bg-white/10"/>
                <div className="h-16 animate-pulse rounded-2xl bg-white/10"/>
                <div className="h-16 animate-pulse rounded-2xl bg-white/10"/>
            </div>
        </GlassCard>
    );
}