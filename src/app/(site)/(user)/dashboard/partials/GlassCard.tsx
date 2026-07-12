export default function GlassCard({
                                      children,
                                      className = "",
                                  }: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md ${className}`}
        >
            {children}
        </div>
    );
}