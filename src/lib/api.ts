import {IBrain, ICategories, IMusic} from "@/lib/types";

const API_URL = process.env.API_URL || 'http://localhost:4000';

export class ApiError extends Error {
    status: number;
    payload?: unknown;

    constructor(message: string, status: number, payload?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.payload = payload;
    }
}

const extractMessage = (data: any): string => {
    const msg = data?.message;

    if (Array.isArray(msg) && msg.length) return String(msg[0]);
    if (typeof msg === "string" && msg.trim()) return msg;

    return "خطایی رخ داد. دوباره تلاش کنید.";
};

export async function fetchJson<T>(
    url: string,
    init: RequestInit = {}
): Promise<T> {

    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type") && init.body) {
        headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {...init, headers});


    if (!res.ok) {
        let payload: any = null;

        try {
            payload = await res.json();
        } catch {
            payload = null;
        }

        const userMessage = payload
            ? extractMessage(payload)
            : "درخواست ناموفق بود.";

        if (process.env.NODE_ENV === "development") {
            console.error("API ERROR:", {
                url,
                status: res.status,
                statusText: res.statusText,
                payload,
            });
        }

        throw new ApiError(userMessage, res.status, payload);
    }

    return res.json() as Promise<T>;
}

export const fetchMusics = async (): Promise<IMusic[]> => {
    return fetchJson<IMusic[]>(`${API_URL}/musics`)
}

export const fetchMusicById = async (id: string): Promise<IMusic> => {
    return fetchJson<IMusic>(`${API_URL}/musics/${id}`)
}


export const fetchCategoryById = async (id: string): Promise<ICategories> => {
    return fetchJson<ICategories>(`${API_URL}/categories/${id}`)
}


export async function fetchMusicsByCategory(categoryName: string): Promise<IMusic[]> {
    return fetchJson<IMusic[]>(`${API_URL}/musics?category=${categoryName}`)
}

export async function fetchBrainMusic(id: string): Promise<IBrain> {
    return fetchJson<IBrain>(`${API_URL}/brain/${id}`)
}