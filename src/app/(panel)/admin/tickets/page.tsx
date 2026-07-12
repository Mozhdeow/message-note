"use client";

import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {
    BiCheckCircle,
    BiEdit,
    BiLoaderAlt,
    BiRefresh,
    BiSupport,
    BiUser,
    BiX,
} from "react-icons/bi";

import DataTable, {DataTableColumn} from "../partials/DataTable";

type TicketStatus = "open" | "answered" | "closed";

type AdminTicket = {
    id: number;
    user_id: number;

    subject?: string | null;
    message: string;

    admin_answer?: string | null;
    answered_at?: string | null;
    closed_at?: string | null;

    status: TicketStatus;

    created_at?: string | null;
    updated_at?: string | null;

    user_name?: string | null;
    username?: string | null;
    user_email?: string | null;
    user_avatar?: string | null;

    answered_by_name?: string | null;
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
    if (!value) return "—";

    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const StatusBadge = ({status}: { status: TicketStatus }) => {
    const className =
        status === "open"
            ? "bg-yellow-400/10 text-yellow-300"
            : status === "answered"
                ? "bg-cyan-400/10 text-cyan-300"
                : "bg-emerald-400/10 text-emerald-300";

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}
        >
            {status}
        </span>
    );
};

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<AdminTicket[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
    const [answer, setAnswer] = useState("");
    const [saving, setSaving] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_get_tickets",
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid admin tickets response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not load tickets.");
            }

            setTickets(result.tickets || []);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading tickets.";

            console.error(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const openTicketModal = (ticket: AdminTicket) => {
        setSelectedTicket(ticket);
        setAnswer(ticket.admin_answer || "");
    };

    const closeModal = () => {
        if (saving || closing) return;

        setSelectedTicket(null);
        setAnswer("");
    };

    const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedTicket) return;

        if (!answer.trim()) {
            toast.error("Answer text is required.");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_answer_ticket",
                    id: String(selectedTicket.id),
                    answer: answer.trim(),
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid answer ticket response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not save answer.");
            }

            toast.success(result.message || "Ticket answered successfully.");
            setSelectedTicket(null);
            setAnswer("");
            await loadTickets();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while saving answer.";

            console.error(error);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const closeTicket = async () => {
        if (!selectedTicket) return;

        const confirmed = window.confirm("Close this ticket?");
        if (!confirmed) return;

        setClosing(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_close_ticket",
                    id: String(selectedTicket.id),
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid close ticket response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not close ticket.");
            }

            toast.success(result.message || "Ticket closed successfully.");
            setSelectedTicket(null);
            setAnswer("");
            await loadTickets();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while closing ticket.";

            console.error(error);
            toast.error(message);
        } finally {
            setClosing(false);
        }
    };

    const columns = useMemo<DataTableColumn<AdminTicket>[]>(
        () => [
            {
                key: "ticket",
                title: "Ticket",
                searchValue: (row) => `${row.subject || ""} ${row.message}`,
                render: (row) => (
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <StatusBadge status={row.status}/>

                            <span className="text-[10px] font-black uppercase tracking-wider text-white/25">
                                #{row.id}
                            </span>
                        </div>

                        <p className="truncate font-black text-white">
                            {row.subject || "No subject"}
                        </p>

                        <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-5 text-white/40">
                            {row.message}
                        </p>
                    </div>
                ),
            },
            {
                key: "user",
                title: "User",
                searchValue: (row) =>
                    `${row.user_name || ""} ${row.username || ""} ${row.user_email || ""}`,
                render: (row) => {
                    const avatarUrl = getImageUrl(row.user_avatar);

                    return (
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={row.user_name || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <BiUser className="h-6 w-6 text-white/35"/>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate font-bold text-white/80">
                                    {row.user_name || row.username || "Unknown user"}
                                </p>

                                <p className="truncate text-xs font-bold text-white/30">
                                    {row.user_email || "No email"}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: "answer",
                title: "Answer",
                searchValue: (row) => row.admin_answer || "",
                render: (row) => (
                    <div className="max-w-sm">
                        {row.admin_answer ? (
                            <>
                                <p className="line-clamp-2 text-xs leading-5 text-white/45">
                                    {row.admin_answer}
                                </p>

                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/25">
                                    {row.answered_by_name
                                        ? `By ${row.answered_by_name}`
                                        : "Answered"}
                                </p>
                            </>
                        ) : (
                            <span className="text-xs font-bold text-white/25">
                                No answer yet
                            </span>
                        )}
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
                        onClick={() => openTicketModal(row)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/65 transition hover:bg-primary hover:text-white"
                    >
                        <BiEdit className="h-4 w-4"/>
                        Manage
                    </button>
                ),
            },
        ],
        []
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
                            Admin Tickets
                        </p>

                        <h1 className="text-4xl font-black text-white">
                            Support Tickets
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                            Read user messages, send a simple answer and close tickets when they are resolved.
                        </p>
                    </div>

                </div>
            </div>


            <DataTable
                data={tickets}
                columns={columns}
                loading={loading}
                rowKey={(row) => row.id}
                title="Tickets"
                description="Simple support tickets submitted by users."
                searchPlaceholder="Search by subject, message, user or answer..."
                emptyTitle="No tickets found."
                emptyDescription="There are no support tickets yet."
                actions={
                    <button
                        type="button"
                        onClick={loadTickets}
                        className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-wider text-white/65 transition hover:bg-white/10 hover:text-white"
                    >
                        <BiRefresh className="h-5 w-5"/>
                        Refresh
                    </button>
                }
            />

            {selectedTicket && (
                <TicketModal
                    ticket={selectedTicket}
                    answer={answer}
                    saving={saving}
                    closing={closing}
                    onAnswerChange={setAnswer}
                    onSubmit={submitAnswer}
                    onClose={closeModal}
                    onCloseTicket={closeTicket}
                />
            )}
        </div>
    );
}

function TicketModal({
                         ticket,
                         answer,
                         saving,
                         closing,
                         onAnswerChange,
                         onSubmit,
                         onClose,
                         onCloseTicket,
                     }: {
    ticket: AdminTicket;
    answer: string;
    saving: boolean;
    closing: boolean;
    onAnswerChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
    onCloseTicket: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <div
                className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#090b14]/95 p-6 shadow-2xl shadow-primary/20">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving || closing}
                    className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <BiX className="h-6 w-6"/>
                </button>

                <div className="mb-6 pr-12">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                        Ticket #{ticket.id}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black text-white">
                            {ticket.subject || "No subject"}
                        </h2>

                        <StatusBadge status={ticket.status}/>
                    </div>

                    <p className="mt-2 text-sm leading-7 text-white/45">
                        Created {formatDate(ticket.created_at)}
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                        <div className="mb-3 flex items-center gap-2 text-white/60">
                            <BiSupport className="h-5 w-5"/>
                            <p className="text-xs font-black uppercase tracking-wider">
                                User Message
                            </p>
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                            {ticket.message}
                        </p>
                    </div>

                    {ticket.admin_answer && (
                        <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-5">
                            <p className="mb-3 text-xs font-black uppercase tracking-wider text-cyan-300">
                                Current Answer
                            </p>

                            <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">
                                {ticket.admin_answer}
                            </p>

                            <p className="mt-3 text-xs font-bold text-white/30">
                                Answered at {formatDate(ticket.answered_at)}
                            </p>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                                Admin Answer
                            </label>

                            <textarea
                                value={answer}
                                onChange={(event) => onAnswerChange(event.target.value)}
                                placeholder="Write your answer..."
                                rows={7}
                                disabled={ticket.status === "closed"}
                                className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold leading-7 text-white outline-none placeholder:text-white/25 transition focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div
                            className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving || closing}
                                className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-wider text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            {ticket.status !== "closed" && (
                                <button
                                    type="button"
                                    onClick={onCloseTicket}
                                    disabled={saving || closing}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-sm font-black uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {closing ? (
                                        <BiLoaderAlt className="h-5 w-5 animate-spin"/>
                                    ) : (
                                        <BiCheckCircle className="h-5 w-5"/>
                                    )}
                                    Close Ticket
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={saving || closing || ticket.status === "closed"}
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
                                        Save Answer
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}