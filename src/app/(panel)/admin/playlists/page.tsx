"use client";

import React, {FormEvent, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {toast} from "sonner";
import {
    BiCopy,
    BiEdit,
    BiHistory,
    BiImage,
    BiLinkExternal,
    BiLoaderAlt,
    BiLockAlt,
    BiRefresh,
    BiSolidPlaylist,
    BiTrash,
    BiUser,
    BiX,
} from "react-icons/bi";

import DataTable, {DataTableColumn} from "../partials/DataTable";

type AdminTab = "all" | "opened";

type AdminPlaylist = {
    id: number;
    user_id: number;
    owner_name?: string | null;
    owner_email?: string | null;

    title: string;
    receiver_name?: string | null;
    receiver_message?: string | null;
    cover_image?: string | null;

    share_token: string;
    is_active: number | boolean;
    view_count?: number;

    categories_count: number;
    tracks_count: number;
    has_main_track: boolean;

    created_at?: string | null;
    updated_at?: string | null;
};

type AdminOpenedPlaylist = {
    id: number;
    user_id: number;
    playlist_id: number;
    opened_at: string;

    opener_name?: string | null;
    opener_username?: string | null;
    opener_email?: string | null;
    opener_avatar?: string | null;

    playlist_title: string;
    receiver_name?: string | null;
    receiver_message?: string | null;
    cover_image?: string | null;
    share_token: string;

    owner_name?: string | null;
    owner_email?: string | null;

    categories_count: number;
    tracks_count: number;
    has_main_track: boolean;
};

type PlaylistFormState = {
    id?: number;
    title: string;
    receiver_name: string;
    receiver_message: string;
    access_password: string;
    is_active: boolean;
    coverFile: File | null;
    coverPreview: string;
};

const emptyForm: PlaylistFormState = {
    title: "",
    receiver_name: "",
    receiver_message: "",
    access_password: "",
    is_active: true,
    coverFile: null,
    coverPreview: "",
};

const getAdminPreviewPath = (token: string) => {
    return `/admin/playlists/preview/${encodeURIComponent(token)}`;
};

const getPublicPlaylistPath = (token: string) => {
    return `/playlist/${encodeURIComponent(token)}`;
};

const getPublicPlaylistFullUrl = (token: string) => {
    if (typeof window === "undefined") return getPublicPlaylistPath(token);
    return `${window.location.origin}${getPublicPlaylistPath(token)}`;
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

const formatDate = (value?: string | null) => {
    if (!value) return "Unknown";

    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function AdminPlaylistsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentTabFromUrl = searchParams.get("tab") === "opened" ? "opened" : "all";
    const [activeTab, setActiveTab] = useState<AdminTab>(currentTabFromUrl);

    const [playlists, setPlaylists] = useState<AdminPlaylist[]>([]);
    const [openedPlaylists, setOpenedPlaylists] = useState<AdminOpenedPlaylist[]>([]);

    const [loadingPlaylists, setLoadingPlaylists] = useState(true);
    const [loadingOpened, setLoadingOpened] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<PlaylistFormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    const [deletingPlaylistId, setDeletingPlaylistId] = useState<number | null>(null);
    const [deletingOpenedId, setDeletingOpenedId] = useState<number | null>(null);

    useEffect(() => {
        setActiveTab(currentTabFromUrl);
    }, [currentTabFromUrl]);

    useEffect(() => {
        loadPlaylists();
        loadOpenedPlaylists();
    }, []);

    const changeTab = (tab: AdminTab) => {
        setActiveTab(tab);

        if (tab === "opened") {
            router.replace("/admin/playlists?tab=opened");
        } else {
            router.replace("/admin/playlists");
        }
    };

    const loadPlaylists = async () => {
        setLoadingPlaylists(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_get_playlists",
                }).toString(),
            });

            const text = await res.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid admin playlists response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not load playlists.");
            }

            setPlaylists(result.playlists || []);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading playlists.";

            console.error(error);
            toast.error(message);
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const loadOpenedPlaylists = async () => {
        setLoadingOpened(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_get_opened_playlists",
                }).toString(),
            });

            const text = await res.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid opened playlists response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not load opened playlists.");
            }

            setOpenedPlaylists(result.opened_playlists || []);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading opened playlists.";

            console.error(error);
            toast.error(message);
        } finally {
            setLoadingOpened(false);
        }
    };

    const refreshCurrentTab = () => {
        if (activeTab === "all") {
            loadPlaylists();
        } else {
            loadOpenedPlaylists();
        }
    };

    const openEditModal = (playlist: AdminPlaylist) => {
        setForm({
            id: playlist.id,
            title: playlist.title || "",
            receiver_name: playlist.receiver_name || "",
            receiver_message: playlist.receiver_message || "",
            access_password: "",
            is_active: Boolean(Number(playlist.is_active)),
            coverFile: null,
            coverPreview: getImageUrl(playlist.cover_image),
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setForm(emptyForm);
    };

    const handleCoverChange = (file: File | null) => {
        if (!file) {
            setForm((prev) => ({
                ...prev,
                coverFile: null,
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            coverFile: file,
            coverPreview: URL.createObjectURL(file),
        }));
    };

    const copyPublicLink = async (token: string) => {
        try {
            await navigator.clipboard.writeText(getPublicPlaylistFullUrl(token));
            toast.success("Public playlist link copied.");
        } catch {
            toast.error("Could not copy link.");
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.id) {
            toast.error("Playlist id is missing.");
            return;
        }

        if (!form.title.trim()) {
            toast.error("Playlist title is required.");
            return;
        }

        setSaving(true);

        try {
            const body = new FormData();

            body.append("action", "admin_update_playlist");
            body.append("id", String(form.id));
            body.append("title", form.title.trim());
            body.append("receiver_name", form.receiver_name.trim());
            body.append("receiver_message", form.receiver_message.trim());
            body.append("access_password", form.access_password.trim());
            body.append("is_active", form.is_active ? "1" : "0");

            if (form.coverFile) {
                body.append("cover_image", form.coverFile);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                credentials: "include",
                body,
            });

            const text = await res.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid playlist update response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not update playlist.");
            }

            toast.success(result.message || "Playlist updated successfully.");
            setModalOpen(false);
            setForm(emptyForm);
            await loadPlaylists();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while updating playlist.";

            console.error(error);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const deletePlaylist = async (playlist: AdminPlaylist) => {
        const confirmed = window.confirm(
            `Delete "${playlist.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingPlaylistId(playlist.id);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_delete_playlist",
                    id: String(playlist.id),
                }).toString(),
            });

            const text = await res.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid playlist delete response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not delete playlist.");
            }

            toast.success(result.message || "Playlist deleted successfully.");
            await loadPlaylists();
            await loadOpenedPlaylists();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while deleting playlist.";

            console.error(error);
            toast.error(message);
        } finally {
            setDeletingPlaylistId(null);
        }
    };

    const deleteOpenedRecord = async (item: AdminOpenedPlaylist) => {
        const confirmed = window.confirm(
            `Delete this access record for "${item.playlist_title}"?`
        );

        if (!confirmed) return;

        setDeletingOpenedId(item.id);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_delete_opened_playlist",
                    id: String(item.id),
                }).toString(),
            });

            const text = await res.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid opened record delete response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not delete access record.");
            }

            toast.success(result.message || "Access record deleted.");
            await loadOpenedPlaylists();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while deleting access record.";

            console.error(error);
            toast.error(message);
        } finally {
            setDeletingOpenedId(null);
        }
    };

    const playlistColumns = useMemo<DataTableColumn<AdminPlaylist>[]>(
        () => [
            {
                key: "playlist",
                title: "Playlist",
                searchValue: (row) =>
                    `${row.title} ${row.receiver_name || ""} ${row.receiver_message || ""}`,
                render: (row) => {
                    const coverUrl = getImageUrl(row.cover_image);

                    return (
                        <div className="flex items-center gap-3">
                            <div
                                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                {coverUrl ? (
                                    <img
                                        src={coverUrl}
                                        alt={row.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiImage className="h-8 w-8 text-white/35"/>
                                )}

                                {row.has_main_track && (
                                    <span
                                        className="absolute left-1 top-1 rounded-full bg-cyan-400/90 px-1.5 py-0.5 text-[8px] font-black uppercase text-black">
                                        Main
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate font-black text-white">
                                    {row.title}
                                </p>

                                <p className="truncate text-xs font-bold text-primary">
                                    {row.receiver_name ? `For ${row.receiver_name}` : "No receiver"}
                                </p>

                                <p className="mt-1 line-clamp-1 text-xs text-white/35">
                                    {row.receiver_message || "No personal message."}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: "owner",
                title: "Owner",
                searchValue: (row) => `${row.owner_name || ""} ${row.owner_email || ""}`,
                render: (row) => (
                    <div>
                        <p className="font-bold text-white/70">
                            {row.owner_name || "Unknown"}
                        </p>
                        <p className="mt-1 text-xs font-bold text-white/30">
                            {row.owner_email || "No email"}
                        </p>
                    </div>
                ),
            },
            {
                key: "status",
                title: "Status",
                searchValue: (row) => (Boolean(Number(row.is_active)) ? "active" : "inactive"),
                render: (row) => (
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            Boolean(Number(row.is_active))
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-red-400/10 text-red-300"
                        }`}
                    >
                        {Boolean(Number(row.is_active)) ? "Active" : "Inactive"}
                    </span>
                ),
            },
            {
                key: "stats",
                title: "Stats",
                render: (row) => (
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-white/50">
                            {row.categories_count || 0} categories
                        </p>
                        <p className="text-xs font-bold text-white/30">
                            {row.tracks_count || 0} tracks
                        </p>
                    </div>
                ),
            },
            {
                key: "views",
                title: "Views",
                render: (row) => (
                    <span className="font-black text-white">
                        {row.view_count || 0}
                    </span>
                ),
            },
            {
                key: "created",
                title: "Created",
                searchValue: (row) => row.created_at || "",
                render: (row) => (
                    <span className="text-xs font-bold uppercase tracking-wider text-white/35">
                        {formatDate(row.created_at)}
                    </span>
                ),
            },
            {
                key: "actions",
                title: "Actions",
                className: "text-right",
                render: (row) => (
                    <div className="flex flex-wrap justify-end gap-2">
                        <Link
                            href={getAdminPreviewPath(row.share_token)}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-black! transition
                            hover:bg-primary hover:text-white!"
                        >
                            <BiLinkExternal className="h-4 w-4"/>
                            Open
                        </Link>

                        <button
                            type="button"
                            onClick={() => copyPublicLink(row.share_token)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-secondary/20 px-3 py-2 text-[10px] font-black uppercase tracking-wider
                            text-white/65 transition hover:bg-secondary/50 hover:text-white"
                        >
                            <BiCopy className="h-4 w-4"/>

                        </button>

                        <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-[10px] font-black uppercase tracking-wider
                             text-white/65 transition hover:bg-primary hover:text-white"
                        >
                            <BiEdit className="h-4 w-4"/>

                        </button>

                        <button
                            type="button"
                            onClick={() => deletePlaylist(row)}
                            disabled={deletingPlaylistId === row.id}
                            className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider
                            text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deletingPlaylistId === row.id ? (
                                <BiLoaderAlt className="h-4 w-4 animate-spin"/>
                            ) : (
                                <BiTrash className="h-4 w-4"/>
                            )}

                        </button>
                    </div>
                ),
            },
        ],
        [deletingPlaylistId]
    );

    const openedColumns = useMemo<DataTableColumn<AdminOpenedPlaylist>[]>(
        () => [
            {
                key: "playlist",
                title: "Playlist",
                searchValue: (row) =>
                    `${row.playlist_title} ${row.receiver_name || ""} ${row.receiver_message || ""}`,
                render: (row) => {
                    const coverUrl = getImageUrl(row.cover_image);

                    return (
                        <div className="flex items-center gap-3">
                            <div
                                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                {coverUrl ? (
                                    <img
                                        src={coverUrl}
                                        alt={row.playlist_title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiImage className="h-8 w-8 text-white/35"/>
                                )}

                                {row.has_main_track && (
                                    <span
                                        className="absolute left-1 top-1 rounded-full bg-cyan-400/90 px-1.5 py-0.5 text-[8px] font-black uppercase text-black">
                                        Main
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate font-black text-white">
                                    {row.playlist_title}
                                </p>

                                <p className="truncate text-xs font-bold text-primary">
                                    {row.receiver_name ? `For ${row.receiver_name}` : "No receiver"}
                                </p>

                                <p className="mt-1 line-clamp-1 text-xs text-white/35">
                                    {row.receiver_message || "No personal message."}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: "opened_by",
                title: "Opened By",
                searchValue: (row) =>
                    `${row.opener_name || ""} ${row.opener_username || ""} ${row.opener_email || ""}`,
                render: (row) => {
                    const avatarUrl = getImageUrl(row.opener_avatar);

                    return (
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={row.opener_name || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiUser className="h-6 w-6 text-white/35"/>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate font-bold text-white/80">
                                    {row.opener_name || row.opener_username || "Unknown user"}
                                </p>

                                <p className="truncate text-xs font-bold text-white/30">
                                    {row.opener_email || "No email"}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: "owner",
                title: "Owner",
                searchValue: (row) => `${row.owner_name || ""} ${row.owner_email || ""}`,
                render: (row) => (
                    <div>
                        <p className="font-bold text-white/70">
                            {row.owner_name || "Unknown"}
                        </p>
                        <p className="mt-1 text-xs font-bold text-white/30">
                            {row.owner_email || "No email"}
                        </p>
                    </div>
                ),
            },
            {
                key: "opened_at",
                title: "Opened At",
                searchValue: (row) => row.opened_at || "",
                render: (row) => (
                    <span className="text-xs font-bold uppercase tracking-wider text-white/35">
                        {formatDate(row.opened_at)}
                    </span>
                ),
            },
            {
                key: "actions",
                title: "Actions",
                className: "text-right",
                render: (row) => (
                    <div className="flex flex-wrap justify-end gap-2">
                        <Link
                            href={getAdminPreviewPath(row.share_token)}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-black! transition
                             hover:bg-primary hover:text-white!"
                        >
                            <BiLinkExternal className="h-4 w-4"/>
                            Open
                        </Link>

                        <button
                            type="button"
                            onClick={() => copyPublicLink(row.share_token)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-secondary/20 px-3 py-2 text-[10px] font-black uppercase tracking-wider
                            text-white/65 transition hover:bg-secondary/50 hover:text-white">
                            <BiCopy className="h-4 w-4"/>

                        </button>

                        <button
                            type="button"
                            onClick={() => deleteOpenedRecord(row)}
                            disabled={deletingOpenedId === row.id}
                            className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider
                            text-red-300 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deletingOpenedId === row.id ? (
                                <BiLoaderAlt className="h-4 w-4 animate-spin"/>
                            ) : (
                                <BiTrash className="h-4 w-4"/>
                            )}

                        </button>
                    </div>
                ),
            },
        ],
        [deletingOpenedId]
    );

    return (
        <div className="space-y-6">

            <div
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-secondary-background/30 p-7 backdrop-blur-xl">
                <div
                    className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/10 blur-3xl"/>

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                            <span className="relative flex h-2 w-2">
                                <span
                                    className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"/>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"/>
                            </span>
                            Admin Playlists
                        </p>

                        <h1 className="text-4xl font-black text-white">
                            Playlist Management
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                            Manage shared music notes, preview playlists without password, and review access history.
                        </p>
                    </div>

                </div>
            </div>


            <div
                className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-white/10 bg-secondary-background/30 p-3 backdrop-blur-xl">
                <button
                    type="button"
                    onClick={() => changeTab("all")}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition ${
                        activeTab === "all"
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-white/[0.04] text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    <BiSolidPlaylist className="h-5 w-5"/>
                    All Playlists
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                        {playlists.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => changeTab("opened")}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition ${
                        activeTab === "opened"
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-white/[0.04] text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    <BiHistory className="h-5 w-5"/>
                    Opened History
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                        {openedPlaylists.length}
                    </span>
                </button>
            </div>

            {activeTab === "all" ? (
                <DataTable
                    data={playlists}
                    columns={playlistColumns}
                    loading={loadingPlaylists}
                    rowKey={(row) => row.id}
                    title="All Playlists"
                    description="All private playlists created by users. Admin preview does not require password."
                    searchPlaceholder="Search by title, owner, receiver or message..."
                    emptyTitle="No playlists found."
                    emptyDescription="There are no playlists matching your search."
                    actions={
                        <button
                            type="button"
                            onClick={refreshCurrentTab}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-wider text-white/65 transition hover:bg-white/10 hover:text-white"
                        >
                            <BiRefresh className="h-5 w-5"/>
                            Refresh
                        </button>
                    }
                />
            ) : (
                <DataTable
                    data={openedPlaylists}
                    columns={openedColumns}
                    loading={loadingOpened}
                    rowKey={(row) => row.id}
                    title="Opened History"
                    description="Access history for private playlists."
                    searchPlaceholder="Search by playlist, user, owner or email..."
                    emptyTitle="No opened playlists found."
                    emptyDescription="No user has opened a playlist yet, or nothing matches your search."
                    actions={
                        <button
                            type="button"
                            onClick={refreshCurrentTab}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-wider text-white/65 transition hover:bg-white/10 hover:text-white"
                        >
                            <BiRefresh className="h-5 w-5"/>
                            Refresh
                        </button>
                    }
                />
            )}

            {modalOpen && (
                <PlaylistModal
                    form={form}
                    saving={saving}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    setForm={setForm}
                    onCoverChange={handleCoverChange}
                />
            )}
        </div>
    );
}

function PlaylistModal({
                           form,
                           saving,
                           onClose,
                           onSubmit,
                           setForm,
                           onCoverChange,
                       }: {
    form: PlaylistFormState;
    saving: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setForm: React.Dispatch<React.SetStateAction<PlaylistFormState>>;
    onCoverChange: (file: File | null) => void;
}) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <div
                className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#090b14]/95 p-6 shadow-2xl shadow-primary/20">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <BiX className="h-6 w-6"/>
                </button>

                <div className="mb-7 pr-12">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                        Edit Playlist
                    </p>

                    <h2 className="text-3xl font-black text-white">
                        Update Playlist
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-white/45">
                        Update playlist information, cover image, password and visibility.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="flex flex-col gap-5 sm:flex-row">
                        <div
                            className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:w-56">
                            <div
                                className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                                {form.coverPreview ? (
                                    <img
                                        src={form.coverPreview}
                                        alt="Playlist cover preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiImage className="h-12 w-12 text-white/30"/>
                                )}
                            </div>

                            <label
                                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-primary hover:text-white">
                                Upload Cover
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) =>
                                        onCoverChange(event.target.files?.[0] || null)
                                    }
                                />
                            </label>

                            <p className="text-center text-xs leading-5 text-white/35">
                                JPG, PNG or WebP cover image.
                            </p>
                        </div>

                        <div className="grid flex-1 gap-4">
                            <InputField
                                label="Title"
                                value={form.title}
                                onChange={(value) =>
                                    setForm((prev) => ({...prev, title: value}))
                                }
                                placeholder="Playlist title"
                            />

                            <InputField
                                label="Receiver Name"
                                value={form.receiver_name}
                                onChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        receiver_name: value,
                                    }))
                                }
                                placeholder="Receiver name"
                            />

                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                                    Receiver Message
                                </label>

                                <textarea
                                    value={form.receiver_message}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            receiver_message: event.target.value,
                                        }))
                                    }
                                    placeholder="Personal message"
                                    rows={5}
                                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-primary/60"
                                />
                            </div>

                            <InputField
                                label="New Password"
                                type="password"
                                value={form.access_password}
                                onChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        access_password: value,
                                    }))
                                }
                                placeholder="Leave empty to keep current password"
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                        <button
                            type="button"
                            onClick={() =>
                                setForm((prev) => ({
                                    ...prev,
                                    is_active: !prev.is_active,
                                }))
                            }
                            className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-black transition ${
                                form.is_active
                                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                    : "border-red-400/20 bg-red-400/10 text-red-300"
                            }`}
                        >
                            <span>{form.is_active ? "Playlist is Active" : "Playlist is Inactive"}</span>
                            <BiLockAlt className="h-5 w-5"/>
                        </button>
                    </div>

                    <div
                        className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-wider text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <BiLoaderAlt className="h-5 w-5 animate-spin"/>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <BiEdit className="h-5 w-5"/>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function InputField({
                        label,
                        value,
                        onChange,
                        placeholder,
                        type = "text",
                    }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-primary/60"
            />
        </div>
    );
}