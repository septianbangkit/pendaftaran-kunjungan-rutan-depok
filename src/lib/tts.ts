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

// Convert number to Indonesian words (e.g., 1 → "satu", 12 → "dua belas")
const numberToIndonesian = (n: number): string => {
  if (n === 0) return 'nol';
  if (n <= 9) return numberWords[n.toString()];
  if (n === 10) return 'sepuluh';
  if (n === 11) return 'sebelas';
  if (n < 20) return numberWords[(n - 10).toString()] + ' belas';
  if (n < 100) {
    const puluhan = Math.floor(n / 10);
    const satuan = n % 10;
    return numberWords[puluhan.toString()] + ' puluh' + (satuan ? ' ' + numberWords[satuan.toString()] : '');
  }
  // 100-999
  const ratusan = Math.floor(n / 100);
  const sisa = n % 100;
  const ratusanWord = ratusan === 1 ? 'seratus' : numberWords[ratusan.toString()] + ' ratus';
  return ratusanWord + (sisa ? ' ' + numberToIndonesian(sisa) : '');
};

// Format queue number for speech (handles A001, B001 format)
export const formatNumberForSpeech = (formattedNumber: string): string => {
  // Extract prefix (A or B) and number
  const prefix = formattedNumber.charAt(0);
  const numPart = formattedNumber.slice(1);
  const number = parseInt(numPart, 10);
  
  const prefixWord = prefix === 'A' ? 'A' : 'B';
  const numberWord = numberToIndonesian(number);
  
  return `${prefixWord} ${numberWord}`;
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

export const announceQueueEmpty = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    
    const text = 'Antrian sudah habis';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    const voice = findBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

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
