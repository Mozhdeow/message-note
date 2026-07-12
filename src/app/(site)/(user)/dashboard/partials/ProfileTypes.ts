export type ProfileTab =
    | "overview"
    | "edit-profile"
    | "my-playlists"
    | "create-playlist"
    | "opened-playlists"
    | "notifications"
    | "ticket";

export type ProfileUser = {
    id: number;
    username: string;
    full_name?: string | null;
    email: string;
    avatar?: string | null;
    role?: string;
    status?: string;
    isLoggedIn?: boolean;
};