"use client";

import React, {
    ChangeEvent,
    ReactNode,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import gsap from "gsap";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import * as mm from "music-metadata-browser";
import {BsArrowLeft, BsArrowRight, BsCheckCircle, BsDisc, BsTrash2} from "react-icons/bs";
import {ImImage} from "react-icons/im";
import {BiCopy, BiLock, BiMusic, BiPlus, BiUpload, BiUser} from "react-icons/bi";
import {FaClock} from "react-icons/fa";
import {TrackPreviewHeader} from "../playlistPartials/TrackPreviewHeader";
import {PreviewTrackRow} from "../playlistPartials/PreviewTrackRow";


export interface PlaylistInfo {
    title: string;
    recipientName: string;
    personalMessage: string;
    password: string;
    coverImage: File | null;
    coverUrl: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
}

export interface Track {
    id: string;
    categoryId: string;
    file: File | null;
    title: string;
    artist: string;
    album: string;
    duration: number;
    coverUrl: string;
    coverFile: File | null;
    lyrics: string;
    description: string;
}

export interface MainTrack {
    file: File | null;
    title: string;
    artist: string;
    album: string;
    duration: number;
    coverUrl: string;
    coverFile: File | null;
    lyrics: string;
    description: string;
}

const emptyMainTrack: MainTrack = {
    file: null,
    title: "",
    artist: "",
    album: "",
    duration: 0,
    coverUrl: "",
    coverFile: null,
    lyrics: "",
    description: "",
};

export const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const extractCoverFromMetadata = (
    picture: mm.IPicture[] | undefined
): { url: string; file: File | null } => {
    if (picture && picture.length > 0) {
        const { format, data } = picture[0];

        const blob = new Blob([new Uint8Array(data)], { type: format });
        const url = URL.createObjectURL(blob);

        const extension = format.split("/")[1] || "jpg";

        const file = new File([blob], `cover-${Date.now()}.${extension}`, {
            type: format,
        });

        return { url, file };
    }

    return { url: "", file: null };
};

export default function CreatePersonalPlaylist() {
    const [step, setStep] = useState(1);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const [info, setInfo] = useState<PlaylistInfo>({
        title: "",
        recipientName: "",
        personalMessage: "",
        password: "",
        coverImage: null,
        coverUrl: "",
    });

    const [mainTrack, setMainTrack] = useState<MainTrack>(emptyMainTrack);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);

    const [isPublishing, setIsPublishing] = useState(false);
    const [publishResult, setPublishResult] = useState<{
        url: string;
        pass: string;
    } | null>(null);

    useLayoutEffect(() => {
        if (!contentRef.current) return;

        gsap.fromTo(
            contentRef.current,
            { opacity: 0, x: 30, scale: 0.98 },
            { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "power3.out" }
        );
    }, [step]);

    const handleInfoChange = <K extends keyof PlaylistInfo>(
        field: K,
        value: PlaylistInfo[K]
    ) => {
        setInfo((prev) => ({ ...prev, [field]: value }));
    };

    const handlePlaylistCover = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        handleInfoChange("coverImage", file);
        handleInfoChange("coverUrl", URL.createObjectURL(file));
    };

    const handleMainTrackUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const toastId = toast.loading("Extracting main music metadata...");

        try {
            const metadata = await mm.parseBlob(file);

            const { url: coverUrl, file: coverFile } = extractCoverFromMetadata(
                metadata.common.picture
            );

            setMainTrack({
                file,
                title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
                artist: metadata.common.artist || "Unknown Artist",
                album: metadata.common.album || "Unknown Album",
                duration: metadata.format.duration || 0,
                coverUrl,
                coverFile,
                lyrics: "",
                description: "",
            });

            toast.success("Main music added successfully.", { id: toastId });
        } catch (error) {
            console.error("Main music metadata error:", error);

            setMainTrack({
                file,
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
                album: "Unknown Album",
                duration: 0,
                coverUrl: "",
                coverFile: null,
                lyrics: "",
                description: "",
            });

            toast.success("Main music added successfully.", { id: toastId });
        }
    };

    const updateMainTrack = <K extends keyof MainTrack>(
        field: K,
        value: MainTrack[K]
    ) => {
        setMainTrack((prev) => ({ ...prev, [field]: value }));
    };

    const removeMainTrack = () => {
        setMainTrack(emptyMainTrack);
    };

    const addCategory = () => {
        if (categories.length >= 8) {
            toast.error("Maximum 8 categories allowed.");
            return;
        }

        setCategories((prev) => [
            ...prev,
            {
                id: uuidv4(),
                name: "",
                description: "",
            },
        ]);
    };

    const updateCategory = (
        id: string,
        field: keyof Category,
        value: string
    ) => {
        setCategories((prev) =>
            prev.map((category) =>
                category.id === id ? { ...category, [field]: value } : category
            )
        );
    };

    const removeCategory = (id: string) => {
        setCategories((prev) => prev.filter((category) => category.id !== id));
        setTracks((prev) => prev.filter((track) => track.categoryId !== id));
    };

    const handleTrackUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (!files || files.length === 0) return;

        if (categories.length === 0) {
            toast.error("Please create a category first before adding tracks.");
            return;
        }

        const toastId = toast.loading("Extracting metadata...");
        const newTracks: Track[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                const metadata = await mm.parseBlob(file);

                const { url: coverUrl, file: coverFile } = extractCoverFromMetadata(
                    metadata.common.picture
                );

                newTracks.push({
                    id: uuidv4(),
                    categoryId: categories[0].id,
                    file,
                    title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
                    artist: metadata.common.artist || "Unknown Artist",
                    album: metadata.common.album || "Unknown Album",
                    duration: metadata.format.duration || 0,
                    coverUrl,
                    coverFile,
                    lyrics: "",
                    description: "",
                });
            } catch (error) {
                console.error("Metadata extraction error:", error);

                newTracks.push({
                    id: uuidv4(),
                    categoryId: categories[0].id,
                    file,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Unknown Artist",
                    album: "Unknown Album",
                    duration: 0,
                    coverUrl: "",
                    coverFile: null,
                    lyrics: "",
                    description: "",
                });
            }
        }

        setTracks((prev) => [...prev, ...newTracks]);
        toast.success("Tracks added successfully.", { id: toastId });

        e.target.value = "";
    };

    const updateTrack = <K extends keyof Track>(
        id: string,
        field: K,
        value: Track[K]
    ) => {
        setTracks((prev) =>
            prev.map((track) =>
                track.id === id ? { ...track, [field]: value } : track
            )
        );
    };

    const removeTrack = (id: string) => {
        setTracks((prev) => prev.filter((track) => track.id !== id));
    };

    const handleNext = () => {
        if (step === 1) {
            if (!info.title.trim()) {
                toast.error("Playlist name is required.");
                return;
            }

            if (info.password.length < 4) {
                toast.error("Password must be at least 4 characters.");
                return;
            }

            if (!mainTrack.file) {
                toast.error("Main music is required.");
                return;
            }

            if (!mainTrack.title.trim()) {
                toast.error("Main music title is required.");
                return;
            }
        }

        if (step === 2) {
            if (categories.length === 0) {
                toast.error("Create at least one category.");
                return;
            }

            if (categories.some((category) => !category.name.trim())) {
                toast.error("All categories must have a name.");
                return;
            }
        }

        if (step === 3) {
            if (tracks.length === 0) {
                toast.error("Add at least one track.");
                return;
            }

            if (tracks.some((track) => !track.categoryId)) {
                toast.error("All tracks must belong to a category.");
                return;
            }
        }

        setStep((prev) => prev + 1);
    };

    const handlePrev = () => {
        setStep((prev) => Math.max(1, prev - 1));
    };

    const copyToClipboard = () => {
        if (!publishResult?.url) return;

        navigator.clipboard.writeText(publishResult.url);
        toast.success("Link copied to clipboard.");
    };

    const handlePublish = async () => {
        setIsPublishing(true);

        const publishToast = toast.loading("Publishing your playlist...");

        try {
            const formData = new FormData();

            formData.append("action", "create_playlist");

            formData.append("title", info.title);
            formData.append("receiver_name", info.recipientName);
            formData.append("receiver_message", info.personalMessage);
            formData.append("access_password", info.password);

            if (info.coverImage) {
                formData.append("cover_image", info.coverImage);
            }

            if (mainTrack.file) {
                formData.append("main_track[file]", mainTrack.file);
                formData.append("main_track[track_name]", mainTrack.title);
                formData.append("main_track[artist_name]", mainTrack.artist);
                formData.append("main_track[album_name]", mainTrack.album);
                formData.append("main_track[duration]", String(mainTrack.duration));
                formData.append("main_track[lyrics]", mainTrack.lyrics);
                formData.append("main_track[description]", mainTrack.description);

                if (mainTrack.coverFile) {
                    formData.append("main_track[cover_image]", mainTrack.coverFile);
                }
            }

            categories.forEach((category, index) => {
                formData.append(`categories[${index}][id]`, category.id);
                formData.append(`categories[${index}][name]`, category.name);
                formData.append(
                    `categories[${index}][description]`,
                    category.description
                );
                formData.append(`categories[${index}][sort_order]`, String(index));
            });

            tracks.forEach((track, index) => {
                formData.append(`tracks[${index}][category_id]`, track.categoryId);
                formData.append(`tracks[${index}][track_name]`, track.title);
                formData.append(`tracks[${index}][artist_name]`, track.artist);
                formData.append(`tracks[${index}][album_name]`, track.album);
                formData.append(`tracks[${index}][lyrics]`, track.lyrics);
                formData.append(`tracks[${index}][description]`, track.description);
                formData.append(`tracks[${index}][duration]`, String(track.duration));
                formData.append(`tracks[${index}][sort_order]`, String(index));

                if (track.file) {
                    formData.append(`tracks[${index}][file]`, track.file);
                }

                if (track.coverFile) {
                    formData.append(`tracks[${index}][cover_image]`, track.coverFile);
                }
            });

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_PHP_API}/process.php`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            const text = await response.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                console.error("Invalid create playlist response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!data.success) {
                throw new Error(data.message || "Failed to publish playlist.");
            }

            setPublishResult({
                url: data.url,
                pass: data.password,
            });

            toast.success("Playlist published successfully.", { id: publishToast });
            setStep(5);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Server connection error.";

            toast.error(message, { id: publishToast });
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="w-full py-4 text-white">
            <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-background/25 via-background/20 to-primary/10 shadow-[0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur-md">
                <WizardStepper step={step} totalSteps={5} />

                <div
                    ref={contentRef}
                    className="relative flex min-h-[560px] flex-col overflow-hidden p-6 sm:p-9 lg:p-11"
                >
                    {step === 1 && (
                        <StepOne
                            info={info}
                            mainTrack={mainTrack}
                            onInfoChange={handleInfoChange}
                            onPlaylistCover={handlePlaylistCover}
                            onMainTrackUpload={handleMainTrackUpload}
                            onMainTrackChange={updateMainTrack}
                            onRemoveMainTrack={removeMainTrack}
                        />
                    )}

                    {step === 2 && (
                        <StepTwo
                            categories={categories}
                            onAddCategory={addCategory}
                            onUpdateCategory={updateCategory}
                            onRemoveCategory={removeCategory}
                        />
                    )}

                    {step === 3 && (
                        <StepThree
                            tracks={tracks}
                            categories={categories}
                            onTrackUpload={handleTrackUpload}
                            onUpdateTrack={updateTrack}
                            onRemoveTrack={removeTrack}
                        />
                    )}

                    {step === 4 && (
                        <StepFour
                            info={info}
                            mainTrack={mainTrack}
                            categories={categories}
                            tracks={tracks}
                        />
                    )}

                    {step === 5 && publishResult && (
                        <StepFive
                            publishResult={publishResult}
                            onCopy={copyToClipboard}
                        />
                    )}
                </div>

                {step < 5 && (
                    <div className="mt-auto flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-5 sm:px-9 lg:px-11">
                        <WizardButton
                            type="button"
                            variant="ghost"
                            onClick={handlePrev}
                            disabled={step === 1 || isPublishing}
                            className={step === 1 ? "pointer-events-none opacity-0" : ""}
                        >
                            <BsArrowLeft className="h-4 w-4" />
                            Back
                        </WizardButton>

                        <WizardButton
                            type="button"
                            onClick={step === 4 ? handlePublish : handleNext}
                            disabled={isPublishing}
                        >
                            {isPublishing ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : step === 4 ? (
                                "Publish Playlist"
                            ) : (
                                <>
                                    Next Step
                                    <BsArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </WizardButton>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepOne({
                     info,
                     mainTrack,
                     onInfoChange,
                     onPlaylistCover,
                     onMainTrackUpload,
                     onMainTrackChange,
                     onRemoveMainTrack,
                 }: {
    info: PlaylistInfo;
    mainTrack: MainTrack;
    onInfoChange: <K extends keyof PlaylistInfo>(
        field: K,
        value: PlaylistInfo[K]
    ) => void;
    onPlaylistCover: (e: ChangeEvent<HTMLInputElement>) => void;
    onMainTrackUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onMainTrackChange: <K extends keyof MainTrack>(
        field: K,
        value: MainTrack[K]
    ) => void;
    onRemoveMainTrack: () => void;
}) {
    return (
        <div className="mx-auto w-full max-w-3xl space-y-8">
            <StepTitle
                title="Craft a Musical Gift"
                description="Create a private playlist, choose a main music, and protect everything with a password."
            />

            <div className="grid gap-8 md:grid-cols-3">
                <div>
                    <FieldLabel>Playlist Cover</FieldLabel>

                    <UploadBox
                        previewUrl={info.coverUrl}
                        accept="image/*"
                        onChange={onPlaylistCover}
                        emptyIcon={<ImImage className="h-8 w-8 text-primary" />}
                        emptyTitle="Upload Cover"
                        emptyDescription="Image file"
                    />
                </div>

                <div className="space-y-5 md:col-span-2">
                    <WizardInput
                        label="Playlist Name *"
                        value={info.title}
                        onChange={(value) => onInfoChange("title", value)}
                        placeholder="e.g., Late Night Drives"
                    />

                    <WizardInput
                        label="Recipient Name"
                        value={info.recipientName}
                        onChange={(value) => onInfoChange("recipientName", value)}
                        placeholder="For someone special..."
                        icon={<BiUser className="h-5 w-5" />}
                    />

                    <WizardInput
                        label="Access Password *"
                        value={info.password}
                        onChange={(value) => onInfoChange("password", value)}
                        placeholder="Min 4 characters"
                        type="password"
                        icon={<BiLock className="h-5 w-5" />}
                    />
                </div>
            </div>

            <MainMusicBox
                mainTrack={mainTrack}
                onUpload={onMainTrackUpload}
                onChange={onMainTrackChange}
                onRemove={onRemoveMainTrack}
            />

            <WizardTextarea
                label="Personal Message"
                value={info.personalMessage}
                onChange={(value) => onInfoChange("personalMessage", value)}
                placeholder="Write a heartfelt message to accompany the music..."
            />
        </div>
    );
}

function MainMusicBox({
                          mainTrack,
                          onUpload,
                          onChange,
                          onRemove,
                      }: {
    mainTrack: MainTrack;
    onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onChange: <K extends keyof MainTrack>(field: K, value: MainTrack[K]) => void;
    onRemove: () => void;
}) {
    return (
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.045] p-5 shadow-[0_0_35px_rgba(35,177,216,0.08)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                        Main Music
                    </p>

                    <h3 className="mt-2 text-xl font-black text-white">
                        Choose the main song
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-white/45">
                        This music will be shown above all categories as the highlighted
                        track.
                    </p>
                </div>

                {mainTrack.file && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="w-fit rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                    >
                        Remove
                    </button>
                )}
            </div>

            {!mainTrack.file ? (
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400/25 bg-black/25 p-6 text-center transition hover:border-cyan-300/60 hover:bg-white/[0.04]">
                    <BiMusic className="mb-3 h-10 w-10 text-cyan-300" />

                    <span className="font-black text-white">Upload Main Music</span>

                    <span className="mt-1 text-sm text-white/40">
            MP3 or audio file
          </span>

                    <input
                        type="file"
                        accept=".mp3,audio/*"
                        className="hidden"
                        onChange={onUpload}
                    />
                </label>
            ) : (
                <div className="space-y-5">
                    <TrackPreviewHeader
                        coverUrl={mainTrack.coverUrl}
                        title={mainTrack.title}
                        artist={mainTrack.artist}
                        album={mainTrack.album}
                        duration={mainTrack.duration}
                        tone="cyan"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <WizardInput
                            label="Main Music Title"
                            value={mainTrack.title}
                            onChange={(value) => onChange("title", value)}
                            placeholder="Track title"
                            tone="cyan"
                        />

                        <WizardInput
                            label="Artist"
                            value={mainTrack.artist}
                            onChange={(value) => onChange("artist", value)}
                            placeholder="Artist"
                            tone="cyan"
                        />

                        <WizardInput
                            label="Album"
                            value={mainTrack.album}
                            onChange={(value) => onChange("album", value)}
                            placeholder="Album"
                            tone="cyan"
                        />

                        <WizardInput
                            label="Personal Note"
                            value={mainTrack.description}
                            onChange={(value) => onChange("description", value)}
                            placeholder="Why is this the main song?"
                            tone="cyan"
                        />

                        <div className="md:col-span-2">
                            <WizardInput
                                label="Lyrics Snippet"
                                value={mainTrack.lyrics}
                                onChange={(value) => onChange("lyrics", value)}
                                placeholder="Favorite line..."
                                tone="cyan"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StepTwo({
                     categories,
                     onAddCategory,
                     onUpdateCategory,
                     onRemoveCategory,
                 }: {
    categories: Category[];
    onAddCategory: () => void;
    onUpdateCategory: (
        id: string,
        field: keyof Category,
        value: string
    ) => void;
    onRemoveCategory: (id: string) => void;
}) {
    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Categories</h2>
                    <p className="mt-1 text-sm text-white/45">
                        Organize your tracks into distinct vibes ({categories.length}/8).
                    </p>
                </div>

                <WizardButton
                    type="button"
                    onClick={onAddCategory}
                    disabled={categories.length >= 8}
                    variant="soft"
                >
                    <BiPlus className="h-4 w-4" />
                    Add Category
                </WizardButton>
            </div>

            {categories.length === 0 ? (
                <EmptyState
                    icon={<BsDisc className="h-12 w-12" />}
                    title="No categories added yet."
                    description="Create at least one category to start adding music."
                />
            ) : (
                <div className="grid max-h-[55vh] gap-4 overflow-y-auto pr-2 md:grid-cols-2">
                    {categories.map((category, index) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            index={index}
                            onUpdate={onUpdateCategory}
                            onRemove={onRemoveCategory}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CategoryCard({
                          category,
                          index,
                          onUpdate,
                          onRemove,
                      }: {
    category: Category;
    index: number;
    onUpdate: (id: string, field: keyof Category, value: string) => void;
    onRemove: (id: string) => void;
}) {
    return (
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-primary/30 hover:bg-white/[0.055]">
            <button
                type="button"
                onClick={() => onRemove(category.id)}
                className="absolute right-4 top-4 rounded-lg p-2 text-red-400 opacity-0 transition hover:bg-red-400/10 group-hover:opacity-100"
            >
                <BsTrash2 className="h-4 w-4" />
            </button>

            <div className="space-y-4">
                <WizardInput
                    label={`Category ${index + 1} Name`}
                    value={category.name}
                    onChange={(value) => onUpdate(category.id, "name", value)}
                    placeholder="e.g., Acoustic Mornings"
                    small
                />

                <WizardTextarea
                    label="Description"
                    value={category.description}
                    onChange={(value) => onUpdate(category.id, "description", value)}
                    placeholder="Brief vibe description..."
                    small
                />
            </div>
        </div>
    );
}

function StepThree({
                       tracks,
                       categories,
                       onTrackUpload,
                       onUpdateTrack,
                       onRemoveTrack,
                   }: {
    tracks: Track[];
    categories: Category[];
    onTrackUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onUpdateTrack: <K extends keyof Track>(
        id: string,
        field: K,
        value: Track[K]
    ) => void;
    onRemoveTrack: (id: string) => void;
}) {
    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Curate Tracks</h2>
                    <p className="mt-1 text-sm text-white/45">
                        Upload music files and assign them to categories.
                    </p>
                </div>

                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(147,51,234,0.25)] transition hover:shadow-[0_0_30px_rgba(147,51,234,0.45)]">
                    <BiUpload className="h-4 w-4" />
                    Upload Tracks

                    <input
                        type="file"
                        multiple
                        accept=".mp3,audio/*"
                        className="hidden"
                        onChange={onTrackUpload}
                    />
                </label>
            </div>

            {tracks.length === 0 ? (
                <EmptyState
                    icon={<BiMusic className="h-12 w-12" />}
                    title="Your playlist is empty."
                    description="Upload audio files to start."
                />
            ) : (
                <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-2">
                    {tracks.map((track) => (
                        <TrackCard
                            key={track.id}
                            track={track}
                            categories={categories}
                            onUpdate={onUpdateTrack}
                            onRemove={onRemoveTrack}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TrackCard({
                       track,
                       categories,
                       onUpdate,
                       onRemove,
                   }: {
    track: Track;
    categories: Category[];
    onUpdate: <K extends keyof Track>(
        id: string,
        field: K,
        value: Track[K]
    ) => void;
    onRemove: (id: string) => void;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {track.coverUrl ? (
                        <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <BiMusic className="h-6 w-6 text-white/35" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-lg font-black text-white">
                        {track.title}
                    </h4>

                    <p className="truncate text-sm text-primary">
                        {track.artist}{" "}
                        <span className="text-white/35">• {track.album}</span>
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-xs text-white/35">
                        <FaClock className="h-3 w-3" />
                        {formatDuration(track.duration)}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onRemove(track.id)}
                    className="rounded-lg p-2 text-red-400 transition hover:bg-red-400/10"
                >
                    <BsTrash2 className="h-5 w-5" />
                </button>
            </div>

            <div className="mt-4 grid gap-4 border-t border-white/5 pt-4 md:grid-cols-3">
                <div>
                    <FieldLabel small>Assign Category</FieldLabel>

                    <select
                        value={track.categoryId}
                        onChange={(e) => onUpdate(track.id, "categoryId", e.target.value)}
                        className={inputClassName}
                    >
                        {categories.map((category) => (
                            <option
                                key={category.id}
                                value={category.id}
                                className="bg-gray-950 text-white"
                            >
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <WizardInput
                    label="Personal Note"
                    value={track.description}
                    onChange={(value) => onUpdate(track.id, "description", value)}
                    placeholder="Why this song?"
                    small
                />

                <WizardInput
                    label="Lyrics Snippet"
                    value={track.lyrics}
                    onChange={(value) => onUpdate(track.id, "lyrics", value)}
                    placeholder="Favorite line..."
                    small
                />
            </div>
        </div>
    );
}

function StepFour({
                      info,
                      mainTrack,
                      categories,
                      tracks,
                  }: {
    info: PlaylistInfo;
    mainTrack: MainTrack;
    categories: Category[];
    tracks: Track[];
}) {
    return (
        <div className="flex max-h-[64vh] flex-col overflow-y-auto pr-3">
            <div className="mb-8 flex flex-col items-center gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
                <div className="h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                    {info.coverUrl ? (
                        <img
                            src={info.coverUrl}
                            alt={info.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                            <ImImage className="h-16 w-16 text-white/20" />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-white/35">
                        Private Playlist
                    </p>

                    <h1 className="font-display text-4xl font-black text-white md:text-5xl">
                        {info.title}
                    </h1>

                    {info.recipientName && (
                        <p className="mt-3 font-bold text-primary">
                            For: {info.recipientName}
                        </p>
                    )}

                    {info.personalMessage && (
                        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm italic leading-6 text-white/55">
                            “{info.personalMessage}”
                        </p>
                    )}
                </div>
            </div>

            {mainTrack.file && (
                <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.055] p-5">
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                        Main Music
                    </p>

                    <TrackPreviewHeader
                        coverUrl={mainTrack.coverUrl}
                        title={mainTrack.title}
                        artist={mainTrack.artist}
                        album={mainTrack.album}
                        duration={mainTrack.duration}
                        description={mainTrack.description}
                        tone="cyan"
                    />
                </div>
            )}

            <div className="space-y-8 pb-6">
                {categories.map((category) => {
                    const categoryTracks = tracks.filter(
                        (track) => track.categoryId === category.id
                    );

                    if (categoryTracks.length === 0) return null;

                    return (
                        <div key={category.id}>
                            <div className="mb-4">
                                <h3 className="border-l-4 border-primary pl-3 text-2xl font-black text-white">
                                    {category.name}
                                </h3>

                                {category.description && (
                                    <p className="ml-4 mt-1 text-sm text-white/45">
                                        {category.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1 rounded-2xl border border-white/5 bg-black/20 p-2">
                                {categoryTracks.map((track, index) => (
                                    <PreviewTrackRow
                                        key={track.id}
                                        index={index}
                                        track={track}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StepFive({
                      publishResult,
                      onCopy,
                  }: {
    publishResult: { url: string; pass: string };
    onCopy: () => void;
}) {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-8 py-10 text-center">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20 blur-[40px]" />

                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <BsCheckCircle className="h-12 w-12 text-emerald-400" />
                </div>
            </div>

            <div>
                <h2 className="mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-4xl font-black text-transparent">
                    Playlist Ready!
                </h2>

                <p className="mx-auto max-w-md text-white/45">
                    Your private playlist is ready. Send the secure link and password to
                    your recipient.
                </p>
            </div>

            <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-black/30 p-6">
                <div>
                    <FieldLabel>Secret Link</FieldLabel>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <span className="truncate pr-4 font-mono text-sm text-white/60">
              {publishResult.url}
            </span>

                        <button
                            type="button"
                            onClick={onCopy}
                            className="flex shrink-0 items-center gap-2 rounded-lg bg-primary/20 p-2 text-xs font-black text-primary transition hover:bg-primary/30"
                        >
                            <BiCopy className="h-4 w-4" />
                            Copy
                        </button>
                    </div>
                </div>

                <div>
                    <FieldLabel>Access Password</FieldLabel>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <span className="font-mono text-xl tracking-widest text-white">
              {publishResult.pass}
            </span>

                        <BiLock className="h-5 w-5 text-white/35" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function WizardStepper({
                           step,
                           totalSteps,
                       }: {
    step: number;
    totalSteps: number;
}) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 pb-7 pt-8 sm:px-9">
            {Array.from({ length: totalSteps }).map((_, index) => {
                const currentStep = index + 1;
                const isDone = step > currentStep;
                const isActive = step >= currentStep;

                return (
                    <div
                        key={currentStep}
                        className="flex flex-1 items-center last:flex-none"
                    >
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black transition-all duration-500 ${
                                isActive
                                    ? "border-primary/60 bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_20px_rgba(147,51,234,0.35)]"
                                    : "border-white/10 bg-white/5 text-white/30"
                            }`}
                        >
                            {isDone ? <BsCheckCircle className="h-5 w-5" /> : currentStep}
                        </div>

                        {currentStep !== totalSteps && (
                            <div
                                className={`mx-3 h-[2px] flex-1 transition-all duration-500 sm:mx-4 ${
                                    step > currentStep
                                        ? "bg-gradient-to-r from-primary to-secondary"
                                        : "bg-white/5"
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function StepTitle({
                       title,
                       description,
                   }: {
    title: string;
    description: string;
}) {
    return (
        <div className="mb-10 space-y-2 text-center">
            <h2 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-black text-transparent">
                {title}
            </h2>

            <p className="text-sm leading-6 text-white/45">{description}</p>
        </div>
    );
}

function FieldLabel({
                        children,
                        small = false,
                    }: {
    children: ReactNode;
    small?: boolean;
}) {
    return (
        <label
            className={`mb-2 block font-bold text-white/55 ${
                small ? "text-xs uppercase tracking-wider" : "text-sm"
            }`}
        >
            {children}
        </label>
    );
}

const inputClassName =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-primary/60 focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

function WizardInput({
                         label,
                         value,
                         onChange,
                         placeholder,
                         type = "text",
                         icon,
                         small = false,
                         tone = "purple",
                     }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    icon?: ReactNode;
    small?: boolean;
    tone?: "purple" | "cyan";
}) {
    const focusClass =
        tone === "cyan"
            ? "focus:border-cyan-400/60 focus:ring-cyan-400/40"
            : "focus:border-primary/60 focus:ring-primary/40";

    return (
        <div>
            <FieldLabel small={small}>{label}</FieldLabel>

            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                        {icon}
                    </div>
                )}

                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${inputClassName} ${focusClass} ${
                        icon ? "pl-12" : ""
                    } ${small ? "py-2.5 text-sm" : ""}`}
                />
            </div>
        </div>
    );
}

function WizardTextarea({
                            label,
                            value,
                            onChange,
                            placeholder,
                            small = false,
                        }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    small?: boolean;
}) {
    return (
        <div>
            <FieldLabel small={small}>{label}</FieldLabel>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${inputClassName} resize-none ${
                    small ? "h-16 py-2.5 text-sm" : "h-32 py-4"
                }`}
            />
        </div>
    );
}

function WizardButton({
                          children,
                          type = "button",
                          onClick,
                          disabled,
                          variant = "primary",
                          className = "",
                      }: {
    children: ReactNode;
    type?: "button" | "submit";
    onClick?: () => void;
    disabled?: boolean;
    variant?: "primary" | "ghost" | "soft";
    className?: string;
}) {
    const variants = {
        primary:
            "border border-primary/30 bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_20px_rgba(147,51,234,0.25)] hover:shadow-[0_0_30px_rgba(147,51,234,0.45)]",
        ghost:
            "border border-transparent bg-transparent text-white/45 hover:bg-white/[0.05] hover:text-white",
        soft:
            "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

function UploadBox({
                       previewUrl,
                       accept,
                       onChange,
                       emptyIcon,
                       emptyTitle,
                       emptyDescription,
                   }: {
    previewUrl: string;
    accept: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    emptyIcon: ReactNode;
    emptyTitle: string;
    emptyDescription: string;
}) {
    return (
        <label className="group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-black/30 transition hover:border-primary/60 hover:bg-white/[0.045]">
            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex flex-col items-center space-y-3 p-4 text-center">
                    <div className="rounded-full bg-primary/10 p-3 transition group-hover:scale-110">
                        {emptyIcon}
                    </div>

                    <span className="text-xs font-bold text-white/55">
            {emptyTitle}
          </span>

                    <span className="text-[11px] text-white/30">
            {emptyDescription}
          </span>
                </div>
            )}

            <input type="file" accept={accept} className="hidden" onChange={onChange} />
        </label>
    );
}

function EmptyState({
                        icon,
                        title,
                        description,
                    }: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] p-8 text-center">
            <div className="mb-4 text-white/25">{icon}</div>

            <p className="font-bold text-white/55">{title}</p>

            <p className="mt-1 text-sm text-white/30">{description}</p>
        </div>
    );
}

