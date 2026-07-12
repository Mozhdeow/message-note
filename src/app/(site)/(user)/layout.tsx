import RequireAuth from "@/components/auth/RequireAuth";

export default function UserLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return <RequireAuth>{children}</RequireAuth>;
}