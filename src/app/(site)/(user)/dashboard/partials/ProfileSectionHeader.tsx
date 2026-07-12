export default function ProfileSectionHeader({
                                                 eyebrow,
                                                 title,
                                                 description,
                                             }: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-8">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-secondary">
                {eyebrow}
            </p>

            <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tighter text-white md:text-6xl">
                {title}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
                {description}
            </p>
        </div>
    );
}