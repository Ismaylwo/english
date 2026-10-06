// Web Speech API wrapper for native English text-to-speech

class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isLoaded = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    if (this.voices.length > 0) {
      this.isLoaded = true;
      // Prioritize natural US/UK English voices
      const preferred = this.voices.find(v => 
        (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('David')))
      ) || this.voices.find(v => v.lang.startsWith('en-US')) 
        || this.voices.find(v => v.lang.startsWith('en'));

      this.selectedVoice = preferred || null;
    }
  }

  public speak(text: string, rate: number = 0.95): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel(); // Stop any pending speech

        if (!this.isLoaded) {
          this.initVoices();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.pitch = 1.0;

        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }
}

export const speechService = new SpeechService();
