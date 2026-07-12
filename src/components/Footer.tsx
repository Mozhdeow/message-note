import React from 'react';
import Link from "next/link";

function Footer() {
    return (
        <footer
            className="relative z-10 border-t border-white/10 px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1800px] mx-auto text-sm text-white/40">
            <span>© {new Date().getFullYear()} Message Note. All rights reserved.</span>
            <div className="flex gap-6">
                <Link href="/dashboard/profile?tab=ticket" className="hover:text-white/70 transition-colors">
                    Support
                </Link>
                <Link href="/dashboard/profile?tab=my-playlists" className="hover:text-white/70 transition-colors">
                    Playlists
                </Link>
            </div>
        </footer>
    );
}

export default Footer;