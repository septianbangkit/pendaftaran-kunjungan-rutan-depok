// Text-to-Speech utility for queue announcements

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
  return num.split('').map(digit => numberWords[digit] || digit).join(' ');
};

export const announceQueue = (queueNumber: string, loket: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const numberSpoken = formatNumberForSpeech(queueNumber);
    const loketSpoken = loketWords[loket] || loket.toString();
    
    const text = `Nomor antrian ${numberSpoken}, menuju loket ${loketSpoken}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(v => v.lang.startsWith('id'));
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      resolve(); // Resolve anyway to not block
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
