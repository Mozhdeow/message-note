import React from "react";
import AdminShell from "@/app/(panel)/admin/partials/AdminShell";

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    return (
        <AdminShell>{children}</AdminShell>
    )
}