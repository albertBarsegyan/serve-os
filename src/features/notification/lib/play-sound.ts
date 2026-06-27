import soundUrl from '../sounds/audio-play.mp3'

let audio: HTMLAudioElement | undefined

export function playNotificationSound(): void {
  if (typeof window === 'undefined') return
  if (!audio) {
    audio = new Audio(soundUrl)
  }
  audio.currentTime = 0
}
