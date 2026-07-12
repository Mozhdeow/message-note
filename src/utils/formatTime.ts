export const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '00:00'

    const min = Math.floor(time / 60)
    const sec = Math.floor(time % 60)

    return `${min}:${sec.toString().padStart(2, '0')}`
}