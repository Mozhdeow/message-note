"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    BiCheckCircle,
    BiLoaderAlt,
    BiMessageSquareAdd,
    BiRefresh,
    BiSupport,
    BiTimeFive,
    BiX,
} from "react-icons/bi";

import GlassCard from "../GlassCard";
import ProfileSectionHeader from "../ProfileSectionHeader";

type TicketStatus = "open" | "answered" | "closed";

type UserTicket = {
    id: number;
    subject?: string | null;
    message: string;
    admin_answer?: string | null;
    status: TicketStatus;
    answered_at?: string | null;
    closed_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    answered_by_name?: string | null;
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

const getStatusClassName = (status: TicketStatus) => {
    if (status === "open") {
        return "bg-yellow-400/10 text-yellow-300 border-yellow-400/20";
    }

    if (status === "answered") {
        return "bg-cyan-400/10 text-cyan-300 border-cyan-400/20";
    }

    return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
};

export default function TicketPanel() {
    const [tickets, setTickets] = useState<UserTicket[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [creating, setCreating] = useState(false);

    const [closingId, setClosingId] = useState<number | null>(null);

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
                    action: "get_my_tickets",
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid tickets response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not load tickets.");
            }

            setTickets(result.tickets || []);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading tickets.";

            console.error(error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSubject("");
        setMessage("");
    };

    const closeModal = () => {
        if (creating) return;

        setModalOpen(false);
        resetForm();
    };

    const createTicket = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!message.trim()) {
            toast.error("Message is required.");
            return;
        }

        setCreating(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "create_ticket",
                    subject: subject.trim(),
                    message: message.trim(),
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid create ticket response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not create ticket.");
            }

            toast.success(result.message || "Ticket created successfully.");
            setModalOpen(false);
            resetForm();
            await loadTickets();
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while creating ticket.";

            console.error(error);
            toast.error(errorMessage);
        } finally {
            setCreating(false);
        }
    };

    const closeTicket = async (ticket: UserTicket) => {
        const confirmed = window.confirm("Close this ticket?");
        if (!confirmed) return;

        setClosingId(ticket.id);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "close_my_ticket",
                    id: String(ticket.id),
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
            await loadTickets();
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while closing ticket.";

            console.error(error);
            toast.error(errorMessage);
        } finally {
            setClosingId(null);
        }
    };

    return (
        <div>
            <ProfileSectionHeader
                eyebrow="Support Tickets"
                title="Your tickets"
                description="Send a simple support request and view the admin response here."
            />

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-white/45">
                    {loading
                        ? "Loading tickets..."
                        : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} found`}
                </p>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={loadTickets}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 text-xs font-black uppercase tracking-wider text-white/65 transition hover:bg-white/[0.09] hover:text-white"
                    >
                        <BiRefresh className="h-5 w-5" />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-primary hover:text-white"
                    >
                        <BiMessageSquareAdd className="h-5 w-5" />
                        New Ticket
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    <TicketSkeleton />
                    <TicketSkeleton />
                    <TicketSkeleton />
                </div>
            ) : tickets.length === 0 ? (
                <GlassCard>
                    <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                            <BiSupport className="h-9 w-9" />
                        </div>

                        <h3 className="text-2xl font-black text-white">
                            No tickets yet.
                        </h3>

                        <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
                            Create a support ticket and wait for the admin response.
                        </p>

                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-secondary"
                        >
                            <BiMessageSquareAdd className="h-5 w-5" />
                            Create Ticket
                        </button>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid gap-4">
                    {tickets.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            closing={closingId === ticket.id}
                            onCloseTicket={closeTicket}
                        />
                    ))}
                </div>
            )}

            {modalOpen && (
                <CreateTicketModal
                    subject={subject}
                    message={message}
                    creating={creating}
                    onSubjectChange={setSubject}
                    onMessageChange={setMessage}
                    onSubmit={createTicket}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

function TicketCard({
                        ticket,
                        closing,
                        onCloseTicket,
                    }: {
    ticket: UserTicket;
    closing: boolean;
    onCloseTicket: (ticket: UserTicket) => void;
}) {
    return (
        <GlassCard className="overflow-hidden transition hover:bg-white/[0.05]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusClassName(
                                ticket.status
                            )}`}
                        >
                            {ticket.status}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white/30">
                            <BiTimeFive className="h-4 w-4" />
                            {formatDate(ticket.created_at)}
                        </span>

                        <span className="text-xs font-black uppercase tracking-wider text-white/20">
                            #{ticket.id}
                        </span>
                    </div>

                    <h3 className="text-xl font-black text-white">
                        {ticket.subject || "No subject"}
                    </h3>

                    <div className="mt-4 rounded-3xl border border-white/10 bg-black/15 p-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
                            Your Message
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">
                            {ticket.message}
                        </p>
                    </div>

                    {ticket.admin_answer ? (
                        <div className="mt-4 rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                                Admin Answer
                            </p>

                            <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                                {ticket.admin_answer}
                            </p>

                            <p className="mt-3 text-xs font-bold text-white/30">
                                Answered {formatDate(ticket.answered_at)}
                                {ticket.answered_by_name
                                    ? ` by ${ticket.answered_by_name}`
                                    : ""}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-3xl border border-yellow-400/10 bg-yellow-400/5 p-4">
                            <p className="text-sm font-bold text-yellow-200/80">
                                Waiting for support response.
                            </p>
                        </div>
                    )}
                </div>

                {ticket.status !== "closed" && (
                    <button
                        type="button"
                        onClick={() => onCloseTicket(ticket)}
                        disabled={closing}
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {closing ? (
                            <BiLoaderAlt className="h-5 w-5 animate-spin" />
                        ) : (
                            <BiCheckCircle className="h-5 w-5" />
                        )}
                        Close Ticket
                    </button>
                )}
            </div>
        </GlassCard>
    );
}

function CreateTicketModal({
                               subject,
                               message,
                               creating,
                               onSubjectChange,
                               onMessageChange,
                               onSubmit,
                               onClose,
                           }: {
    subject: string;
    message: string;
    creating: boolean;
    onSubjectChange: (value: string) => void;
    onMessageChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <div className="relative w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#090b14]/95 p-6 shadow-2xl shadow-primary/20">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={creating}
                    className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <BiX className="h-6 w-6" />
                </button>

                <div className="mb-7 pr-12">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                        New Ticket
                    </p>

                    <h2 className="text-3xl font-black text-white">
                        Create Support Ticket
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-white/45">
                        Write your issue and support will answer you here.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                            Subject
                        </label>

                        <input
                            value={subject}
                            onChange={(event) => onSubjectChange(event.target.value)}
                            placeholder="Ticket subject"
                            className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-primary/60"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                            Message
                        </label>

                        <textarea
                            value={message}
                            onChange={(event) => onMessageChange(event.target.value)}
                            placeholder="Write your message..."
                            rows={7}
                            className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold leading-7 text-white outline-none placeholder:text-white/25 transition focus:border-primary/60"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={creating}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-wider text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={creating}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creating ? (
                                <>
                                    <BiLoaderAlt className="h-5 w-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <BiMessageSquareAdd className="h-5 w-5" />
                                    Create Ticket
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TicketSkeleton() {
    return (
        <GlassCard>
            <div className="h-5 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-7 w-1/2 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-5 h-24 w-full animate-pulse rounded-3xl bg-white/10" />
        </GlassCard>
    );
}