"use client";

import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {
    BiCheck,
    BiEdit,
    BiImage,
    BiLoaderAlt,
    BiPlus,
    BiRefresh,
    BiShield,
    BiSupport,
    BiUser,
    BiX,
} from "react-icons/bi";

import DataTable, {DataTableColumn} from "../partials/DataTable";

type AdminRole = "user" | "support" | "admin";

type AdminUser = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    avatar?: string | null;
    role: AdminRole;
    is_active: number | boolean;
    created_at?: string | null;
    updated_at?: string | null;
    playlists_count?: number;
    opened_playlists_count?: number;
};

type UserFormState = {
    id?: number;
    name: string;
    username: string;
    email: string;
    password: string;
    role: AdminRole;
    is_active: boolean;
    avatarFile: File | null;
    avatarPreview: string;
};

const emptyForm: UserFormState = {
    name: "",
    username: "",
    email: "",
    password: "",
    role: "user",
    is_active: true,
    avatarFile: null,
    avatarPreview: "",
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

    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [form, setForm] = useState<UserFormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_get_users",
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid admin users response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not load users.");
            }

            setUsers(result.users || []);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading users.";

            console.error(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setMode("create");
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEditModal = (user: AdminUser) => {
        setMode("edit");

        setForm({
            id: user.id,
            name: user.name || "",
            username: user.username || "",
            email: user.email || "",
            password: "",
            role: user.role || "user",
            is_active: Boolean(Number(user.is_active)),
            avatarFile: null,
            avatarPreview: getImageUrl(user.avatar),
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setForm(emptyForm);
    };

    const handleAvatarChange = (file: File | null) => {
        if (!file) {
            setForm((prev) => ({
                ...prev,
                avatarFile: null,
                avatarPreview: mode === "create" ? "" : prev.avatarPreview,
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            avatarFile: file,
            avatarPreview: URL.createObjectURL(file),
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.name.trim()) {
            toast.error("Name is required.");
            return;
        }

        if (!form.email.trim()) {
            toast.error("Email is required.");
            return;
        }

        if (mode === "create" && !form.password.trim()) {
            toast.error("Password is required for new users.");
            return;
        }

        setSaving(true);

        try {
            const body = new FormData();

            body.append("action", mode === "create" ? "admin_create_user" : "admin_update_user");

            if (mode === "edit" && form.id) {
                body.append("id", String(form.id));
            }

            body.append("name", form.name.trim());
            body.append("username", form.username.trim());
            body.append("email", form.email.trim());
            body.append("password", form.password.trim());
            body.append("role", form.role);
            body.append("is_active", form.is_active ? "1" : "0");

            if (form.avatarFile) {
                body.append("avatar", form.avatarFile);
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
                console.error("Invalid save user response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not save user.");
            }

            toast.success(result.message || "User saved successfully.");
            setModalOpen(false);
            setForm(emptyForm);
            await loadUsers();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while saving user.";

            console.error(error);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo<DataTableColumn<AdminUser>[]>(
        () => [
            {
                key: "user",
                title: "User",
                searchValue: (row) => `${row.name} ${row.username || ""} ${row.email}`,
                render: (row) => {
                    const avatarUrl = getImageUrl(row.avatar);

                    return (
                        <div className="flex items-center gap-3">
                            <div
                                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={row.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiUser className="h-7 w-7 text-white/35"/>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate font-black text-white">
                                    {row.name}
                                </p>

                                <p className="truncate text-xs font-bold text-white/35">
                                    {row.email}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: "username",
                title: "Username",
                searchValue: (row) => row.username || "",
                render: (row) => (
                    <span className="font-bold text-white/55">
                        {row.username || "—"}
                    </span>
                ),
            },
            {
                key: "role",
                title: "Role",
                searchValue: (row) => row.role,
                render: (row) => (
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            row.role === "admin"
                                ? "bg-primary/20 text-primary"
                                : row.role === "support"
                                    ? "bg-cyan-400/10 text-cyan-300"
                                    : "bg-white/10 text-white/55"
                        }`}
                    >
                        {row.role}
                    </span>
                ),
            },
            {
                key: "status",
                title: "Status",
                searchValue: (row) => (Boolean(Number(row.is_active)) ? "active" : "inactive"),
                render: (row) => (
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            Boolean(Number(row.is_active))
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-red-400/10 text-red-300"
                        }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                Boolean(Number(row.is_active)) ? "bg-emerald-400" : "bg-red-400"
                            }`}
                        />
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
                            {row.playlists_count || 0} playlists
                        </p>

                        <p className="text-xs font-bold text-white/30">
                            {row.opened_playlists_count || 0} opened
                        </p>
                    </div>
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
                    <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/65 transition hover:border-primary/40 hover:bg-primary hover:text-white"
                    >
                        <BiEdit className="h-4 w-4"/>
                        Edit
                    </button>
                ),
            },
        ],
        []
    );

    return (
        <div className="relative space-y-6">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]"/>
                <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[120px]"/>
            </div>

            <div
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-secondary-background/30 p-7 backdrop-blur-xl">
                <div
                    className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/10 blur-3xl"/>

                <div className="relative">
                    <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                        <span className="relative flex h-2 w-2">
                            <span
                                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"/>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"/>
                        </span>
                        Admin Users
                    </p>

                    <h1 className="text-4xl font-black text-white">
                        User Management
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                        Manage users, create new accounts, edit profiles, upload avatars and assign roles.
                    </p>
                </div>
            </div>

            <DataTable
                data={users}
                columns={columns}
                loading={loading}
                rowKey={(row) => row.id}
                title="Users"
                description="View and manage all registered users."
                searchPlaceholder="Search by name, email, username or role..."
                emptyTitle="No users found."
                emptyDescription="There are no users matching your search."
                actions={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={loadUsers}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-wider text-white/65 transition hover:bg-white/10 hover:text-white"
                        >
                            <BiRefresh className="h-5 w-5"/>
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-primary hover:text-white"
                        >
                            <BiPlus className="h-5 w-5"/>
                            Add User
                        </button>
                    </div>
                }
            />

            {modalOpen && (
                <UserModal
                    mode={mode}
                    form={form}
                    saving={saving}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    setForm={setForm}
                    onAvatarChange={handleAvatarChange}
                />
            )}
        </div>
    );
}

const ROLE_OPTIONS: {
    value: AdminRole;
    label: string;
    icon: React.ElementType;
    active: string;
}[] = [
    {value: "user", label: "User", icon: BiUser, active: "border-white/30 bg-white/10 text-white"},
    {value: "support", label: "Support", icon: BiSupport, active: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"},
    {value: "admin", label: "Admin", icon: BiShield, active: "border-primary/40 bg-primary/15 text-primary"},
];

function UserModal({
                       mode,
                       form,
                       saving,
                       onClose,
                       onSubmit,
                       setForm,
                       onAvatarChange,
                   }: {
    mode: "create" | "edit";
    form: UserFormState;
    saving: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setForm: React.Dispatch<React.SetStateAction<UserFormState>>;
    onAvatarChange: (file: File | null) => void;
}) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <div
                className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#090b14]/95 p-6 shadow-2xl shadow-primary/20">
                <div
                    className="pointer-events-none absolute -top-20 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl"/>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <BiX className="h-6 w-6"/>
                </button>

                <div className="relative mb-7 pr-12">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                        {mode === "create" ? "Create User" : "Edit User"}
                    </p>

                    <h2 className="text-3xl font-black text-white">
                        {mode === "create" ? "Add New User" : "Update User"}
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-white/45">
                        Set user profile information, avatar, account status and role.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="relative space-y-6">
                    <div className="flex flex-col gap-5 sm:flex-row">
                        <div
                            className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-5 transition hover:border-primary/40 sm:w-56">
                            <div
                                className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                                {form.avatarPreview ? (
                                    <img
                                        src={form.avatarPreview}
                                        alt="Avatar preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiImage className="h-12 w-12 text-white/30"/>
                                )}
                            </div>

                            <label
                                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-primary hover:text-white">
                                Upload Avatar
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) =>
                                        onAvatarChange(event.target.files?.[0] || null)
                                    }
                                />
                            </label>

                            <p className="text-center text-xs leading-5 text-white/35">
                                JPG, PNG or WebP avatar image.
                            </p>
                        </div>

                        <div className="grid flex-1 gap-4">
                            <InputField
                                label="Name"
                                value={form.name}
                                onChange={(value) =>
                                    setForm((prev) => ({...prev, name: value}))
                                }
                                placeholder="User full name"
                            />

                            <InputField
                                label="Username"
                                value={form.username}
                                onChange={(value) =>
                                    setForm((prev) => ({...prev, username: value}))
                                }
                                placeholder="Optional username"
                            />

                            <InputField
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={(value) =>
                                    setForm((prev) => ({...prev, email: value}))
                                }
                                placeholder="email@example.com"
                            />

                            <InputField
                                label={mode === "create" ? "Password" : "New Password"}
                                type="password"
                                value={form.password}
                                onChange={(value) =>
                                    setForm((prev) => ({...prev, password: value}))
                                }
                                placeholder={
                                    mode === "create"
                                        ? "Required"
                                        : "Leave empty to keep current password"
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                                Role
                            </label>

                            <div className="grid grid-cols-3 gap-2">
                                {ROLE_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const isActive = form.role === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() =>
                                                setForm((prev) => ({...prev, role: option.value}))
                                            }
                                            className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition ${
                                                isActive
                                                    ? option.active
                                                    : "border-white/10 bg-black/20 text-white/40 hover:bg-white/[0.06]"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4"/>
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                                Account Status
                            </label>

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
                                <span>{form.is_active ? "Active" : "Inactive"}</span>
                                {form.is_active ? (
                                    <BiCheck className="h-5 w-5"/>
                                ) : (
                                    <BiX className="h-5 w-5"/>
                                )}
                            </button>
                        </div>
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
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-violet-500 px-7 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <BiLoaderAlt className="h-5 w-5 animate-spin"/>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <BiPlus className="h-5 w-5"/>
                                    {mode === "create" ? "Create User" : "Save Changes"}
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