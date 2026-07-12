export interface IMusic {
    id: number
    name: string
    artist: string
    category: string
    file: string
    cover: string
    lyric: string
    chat: string
}

export interface ICategories {
    id: number
    content: string
    name: string
    backgroundImage:string
}

export interface IBrain {
    id: number
    audioName: string
    description: string
    audioFile: string
    audioArtist: string
    audioCover: string
    audioLyric: string
    backgroundImage: string
}