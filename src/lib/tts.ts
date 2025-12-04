// Text-to-Speech utility for queue announcements
// Optimized for natural Indonesian female voice

const numberWords: { [key: string]: string } = {
  '0': 'nol',
  '1': 'satu',
  '2': 'dua',
  '3': 'tiga',
  '4': 'empat',
  '5': 'lima',
  '6': 'enam',
  '7': 'tujuh',
  '8': 'delapan',
  '9': 'sembilan',
};

const loketWords: { [key: number]: string } = {
  1: 'satu',
  2: 'dua',
  3: 'tiga',
  4: 'empat',
  5: 'lima',
};

export const formatNumberForSpeech = (num: string): string => {
  return num.split('').map(digit => numberWords[digit] || digit).join(', ');
};

// Find the best Indonesian female voice
const findBestVoice = (): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  
  // Priority 1: Indonesian female voice
  let voice = voices.find(v => 
    v.lang.startsWith('id') && 
    (v.name.toLowerCase().includes('female') || 
     v.name.toLowerCase().includes('wanita') ||
     v.name.toLowerCase().includes('perempuan'))
  );
  
  if (voice) return voice;
  
  // Priority 2: Any Indonesian voice (prefer Google)
  voice = voices.find(v => v.lang.startsWith('id') && v.name.includes('Google'));
  if (voice) return voice;
  
  // Priority 3: Any Indonesian voice
  voice = voices.find(v => v.lang.startsWith('id'));
  if (voice) return voice;
  
  // Priority 4: Malay voice (similar language)
  voice = voices.find(v => v.lang.startsWith('ms'));
  if (voice) return voice;
  
  return null;
};

export const announceQueue = (queueNumber: string, loket: number): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const numberSpoken = formatNumberForSpeech(queueNumber);
    const loketSpoken = loketWords[loket] || loket.toString();
    
    // Natural Indonesian announcement format
    const text = `Nomor antrian ${numberSpoken}, silakan menuju loket ${loketSpoken}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher for female voice effect
    utterance.volume = 1;

    // Try to find best Indonesian voice
    const voice = findBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      resolve();
    };

    // Small delay to ensure voices are loaded
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  });
};

// Preload voices
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
