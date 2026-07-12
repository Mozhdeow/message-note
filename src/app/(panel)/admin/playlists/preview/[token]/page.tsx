"use client";

import React from "react";
import { useParams } from "next/navigation";
import Tree from "@/components/Tree";
import Background from "@/components/Background";

export default function AdminPlaylistPreviewPage() {
    const params = useParams();
    const token = params.token as string;

    return (
        <div className="-m-5 min-h-screen overflow-hidden lg:-mx-40 ">
            <Background>
                <div className="-mx-24 min-h-screen overflow-x-auto px-20">
                <Tree adminPreview tokenOverride={token} />
                </div>
            </Background>
        </div>
    );
}