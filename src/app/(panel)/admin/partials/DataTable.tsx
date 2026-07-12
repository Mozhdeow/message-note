"use client";

import React, {ReactNode, useMemo, useState} from "react";
import {BiSearch, BiChevronLeft, BiChevronRight, BiFolderOpen} from "react-icons/bi";

export type DataTableColumn<T> = {
    key: string;
    title: string;
    className?: string;
    render: (row: T, index: number) => ReactNode;
    searchValue?: (row: T) => string;
};

type DataTableProps<T> = {
    data: T[];
    columns: DataTableColumn<T>[];
    loading?: boolean;
    rowKey: (row: T) => string | number;
    title?: string;
    description?: string;
    searchPlaceholder?: string;
    actions?: ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    pageSize?: number;
};

export default function DataTable<T>({
                                         data,
                                         columns,
                                         loading = false,
                                         rowKey,
                                         title,
                                         description,
                                         searchPlaceholder = "Search...",
                                         actions,
                                         emptyTitle = "No data found.",
                                         emptyDescription = "There is nothing to show here yet.",
                                         pageSize = 10,
                                     }: DataTableProps<T>) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    const filteredData = useMemo(() => {
        const cleanQuery = query.trim().toLowerCase();

        if (!cleanQuery) return data;

        return data.filter((row) => {
            return columns.some((column) => {
                if (!column.searchValue) return false;

                return column.searchValue(row).toLowerCase().includes(cleanQuery);
            });
        });
    }, [data, columns, query]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const goPrev = () => setPage((prev) => Math.max(1, prev - 1));
    const goNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

    return (
        <div
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-secondary-background/30 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div
                className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/[0.07] blur-[100px]"/>

            <div className="relative border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        {title && (
                            <h2 className="text-2xl font-black text-white">
                                {title}
                            </h2>
                        )}

                        {description && (
                            <p className="mt-2 text-sm leading-6 text-white/45">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative">
                            <BiSearch
                                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30"/>

                            <input
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setPage(1);
                                }}
                                placeholder={searchPlaceholder}
                                className="
                                    h-12 w-full rounded-2xl border border-white/10
                                    bg-black/20 pl-11 pr-4 text-sm font-bold text-white
                                    outline-none placeholder:text-white/30
                                    transition focus:border-primary/60 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]
                                    sm:w-72
                                "
                            />
                        </div>

                        {actions}
                    </div>
                </div>
            </div>

            <div className="relative overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                    <tr className="border-b border-white/10 bg-white/[0.025]">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-5 py-4 text-left text-xs font-black uppercase tracking-[0.22em] text-white/65 ${column.className || ""}`}
                            >
                                {column.title}
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {loading ? (
                        Array.from({length: 6}).map((_, index) => (
                            <tr key={index} className="border-b border-white/5">
                                {columns.map((column) => (
                                    <td key={column.key} className="px-5 py-5">
                                        <div
                                            className="h-5 w-full max-w-[160px] animate-pulse rounded-full bg-white/10"/>
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : paginatedData.length ? (
                        paginatedData.map((row, index) => (
                            <tr
                                key={rowKey(row)}
                                className="group relative border-b border-white/5 transition hover:bg-white/[0.035]"
                            >
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={column.key}
                                        className={`relative px-5 py-4 align-middle text-sm text-white/70 ${column.className || ""}`}
                                    >
                                        {colIndex === 0 && (
                                            <span
                                                className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-cyan-400 opacity-0 transition-all duration-200 group-hover:h-3/5 group-hover:opacity-100"/>
                                        )}
                                        {column.render(row, index)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-5 py-16">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div
                                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-white/25">
                                        <BiFolderOpen className="h-7 w-7"/>
                                    </div>

                                    <h3 className="text-xl font-black text-white">
                                        {emptyTitle}
                                    </h3>

                                    <p className="mt-2 max-w-md text-sm leading-7 text-white/45">
                                        {emptyDescription}
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <div
                className="relative flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold text-white/35">
                    Showing {paginatedData.length} of {filteredData.length} result
                    {filteredData.length === 1 ? "" : "s"}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={page === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-primary/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <BiChevronLeft className="h-6 w-6"/>
                    </button>

                    <span
                        className="rounded-xl border border-white/10 bg-secondary-background/30 px-4 py-2 text-xs font-black text-white/60">
                        {page} / {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={goNext}
                        disabled={page === totalPages}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-primary/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <BiChevronRight className="h-6 w-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
}