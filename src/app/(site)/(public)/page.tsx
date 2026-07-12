import HeroSection from "@/components/HeroSection";
import PlaylistShowcaseSection from "@/components/PlaylistShowcaseSection";
import Footer from "@/components/Footer";

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-white selection:bg-primary">
            <div className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full scale-[1.02] object-cover opacity-100"
                >
                    <source src="/videos/bg-video.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/65 via-background/25 to-background/5" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-background/70" />
            </div>

            <main className="relative z-10">
                <HeroSection />
                <PlaylistShowcaseSection />
            </main>
            <Footer/>
        </div>
    );
}