import HeroSection from "@/components/HeroSection";

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-white selection:bg-primary">
            <div className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full scale-[1.03] object-cover opacity-100"
                >
                    <source src="/videos/bg-video.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-black/20" />

                <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/35 to-background/5" />

                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-background/70" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(162,89,255,0.16),transparent_32%),radial-gradient(circle_at_85%_50%,rgba(35,177,216,0.12),transparent_28%)]" />
            </div>

            <main className="relative z-10">
                <HeroSection />
            </main>
        </div>
    );
}