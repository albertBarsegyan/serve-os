import soundUrl from '../sounds/audio-play.mp3'

let audio: HTMLAudioElement | undefined

export async function playNotificationSound() {
  audio ??= new Audio(soundUrl)

  audio.currentTime = 0

  try {
    await audio.play()
  } catch {
    // Ignore or log
  }
}

export async function initializeAudio() {
  if (typeof window === 'undefined') return

  audio ??= new Audio(soundUrl)

  try {
    await audio.play()
    audio.pause()
    audio.currentTime = 0
  } catch {
    // User gesture wasn't available or browser blocked it.
  }
}

export function disposeAudio() {
  audio?.pause()
  audio = undefined
}
