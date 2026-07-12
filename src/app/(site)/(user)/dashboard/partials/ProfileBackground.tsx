"use client";

export default function ProfileBackground() {
    return (
        <div className="fixed inset-0 z-0 h-full w-full overflow-hidden">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full scale-[1.02] object-cover"
            >
                <source src="/videos/profile-bg.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-black/18" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/55 via-background/20 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/28 via-transparent to-background/55" />

            <div className="absolute left-[7%] top-[18%] h-52 w-52 rounded-full bg-primary/18 blur-[90px]" />
            <div className="absolute bottom-[12%] right-[10%] h-56 w-56 rounded-full bg-secondary/16 blur-[95px]" />
        </div>
    );
}