import { useState, useEffect, useRef } from "react";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { 
  subscribeToChanges,
  getInitialState,
  QueueTicket,
  CalledByLoket
} from "@/lib/queueStore";
import { announceQueue } from "@/lib/tts";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Users, Play } from "lucide-react";

const Display = () => {
  const [calledByLoket, setCalledByLoket] = useState<CalledByLoket>({ 1: null, 2: null, 3: null });
  const [waitingCount, setWaitingCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const lastCalledRef = useRef<{ [key: number]: string | null }>({ 1: null, 2: null, 3: null });

  useEffect(() => {
    const state = getInitialState();
    setCalledByLoket(state.calledByLoket);
    setWaitingCount(state.tickets.filter(t => t.status === 'waiting').length);
    
    // Initialize last called IDs
    for (let i = 1; i <= 3; i++) {
      const loketKey = i as 1 | 2 | 3;
      lastCalledRef.current[i] = state.calledByLoket[loketKey]?.id || null;
    }

    const unsubscribe = subscribeToChanges(async (state) => {
      setWaitingCount(state.tickets.filter(t => t.status === 'waiting').length);
      setCalledByLoket(state.calledByLoket);
      
      // Check each loket for new calls
      for (let i = 1; i <= 3; i++) {
        const loketKey = i as 1 | 2 | 3;
        const newCalled = state.calledByLoket[loketKey];
        const lastId = lastCalledRef.current[i];
        
        if (newCalled && newCalled.id !== lastId) {
          lastCalledRef.current[i] = newCalled.id;
          await announceQueue(newCalled.formattedNumber, i);
        } else if (!newCalled) {
          lastCalledRef.current[i] = null;
        }
      }
    });

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const LoketCard = ({ loket, ticket }: { loket: number; ticket: QueueTicket | null }) => (
    <div 
      className={`bg-card/10 backdrop-blur-md rounded-2xl border-2 p-6 transition-all duration-300 h-full flex flex-col justify-center ${
        ticket 
          ? 'border-gold shadow-glow animate-pulse-slow' 
          : 'border-primary-foreground/20'
      }`}
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-primary-foreground/70 mb-2">
          LOKET {loket}
        </h3>
        
        {ticket ? (
          <>
            <div className="font-mono text-6xl md:text-7xl lg:text-8xl font-bold text-gold leading-none my-4">
              {ticket.formattedNumber}
            </div>
            <div className="bg-gold/20 rounded-lg px-4 py-2 inline-block">
              <span className="text-gold font-medium">Memanggil...</span>
            </div>
          </>
        ) : (
          <>
            <div className="font-mono text-6xl md:text-7xl lg:text-8xl font-bold text-primary-foreground/20 leading-none my-4">
              ---
            </div>
            <div className="bg-primary-foreground/10 rounded-lg px-4 py-2 inline-block">
              <span className="text-primary-foreground/40">Standby</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-navy-dark/80 backdrop-blur-sm border-b-2 border-gold/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <InstitutionLogo size="lg" />
            <div className="text-primary-foreground">
              <h1 className="text-xl md:text-2xl font-bold tracking-wide">
                KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN
              </h1>
              <p className="text-gold text-lg font-medium">RUTAN KELAS I DEPOK</p>
            </div>
          </div>
          <div className="text-right text-primary-foreground">
            <p className="text-sm md:text-base">
              {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
            <p className="text-4xl md:text-5xl font-mono font-bold text-gold">
              {format(currentTime, "HH:mm:ss")}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex p-4 gap-4">
        {/* Left Side - Video/Banner Area */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* Video Area */}
          <div className="flex-1 bg-card/10 backdrop-blur-md rounded-2xl border border-gold/20 overflow-hidden relative min-h-[300px]">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-dark/50">
              <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                <Play className="w-10 h-10 text-gold" />
              </div>
              <p className="text-primary-foreground/50 text-sm">Video / Banner Area</p>
              <p className="text-primary-foreground/30 text-xs mt-1">16:9 Placeholder</p>
            </div>
            {/* Uncomment to add video:
            <video 
              className="w-full h-full object-cover" 
              autoPlay 
              loop 
              muted
              src="/path-to-video.mp4"
            />
            */}
          </div>
          
          {/* Waiting Count Card */}
          <div className="bg-card/10 backdrop-blur-md rounded-2xl border border-gold/20 p-6">
            <div className="flex items-center justify-center gap-3 text-primary-foreground">
              <Users className="w-8 h-8 text-gold" />
              <div className="text-center">
                <p className="text-sm text-primary-foreground/60">Antrian Menunggu</p>
                <p className="text-4xl font-bold text-gold">{waitingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - 3 Loket Display */}
        <div className="w-2/3 flex flex-col gap-4">
          {/* Top Row - Loket 1 & 2 */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <LoketCard loket={1} ticket={calledByLoket[1]} />
            <LoketCard loket={2} ticket={calledByLoket[2]} />
          </div>
          
          {/* Bottom Row - Loket 3 */}
          <div className="flex-1">
            <LoketCard loket={3} ticket={calledByLoket[3]} />
          </div>
        </div>
      </main>

      {/* Running Text Footer */}
      <footer className="bg-gold h-14 flex items-center overflow-hidden">
        <div className="whitespace-nowrap running-text">
          <span className="text-navy-dark font-bold text-lg px-8">
            KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN — RUTAN KELAS I DEPOK — LAYANAN KUNJUNGAN — 
            SILAKAN MENUNGGU DENGAN TERTIB — TERIMA KASIH ATAS KUNJUNGAN ANDA —
            KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN — RUTAN KELAS I DEPOK — LAYANAN KUNJUNGAN — 
            SILAKAN MENUNGGU DENGAN TERTIB — TERIMA KASIH ATAS KUNJUNGAN ANDA —
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Display;
