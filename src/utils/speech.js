// Text-to-speech utility using standard Web Speech API for rural accessibility

class VoiceNarrator {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.onStateChange = null;
  }

  isSupported() {
    return Boolean(this.synth);
  }

  speak(text, lang = 'hi-IN', onEndCallback = null) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clear rural comprehension
    utterance.pitch = 1.05; // Warm, friendly tone

    // Try to find an Indian English or Hindi voice if available
    const voices = this.synth.getVoices();
    const targetVoice = voices.find(v => v.lang.includes(lang === 'hi' ? 'hi' : 'IN')) ||
      voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
    };

    utterance.onend = () => {
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
    }
  }
}

export const narrator = new VoiceNarrator();
