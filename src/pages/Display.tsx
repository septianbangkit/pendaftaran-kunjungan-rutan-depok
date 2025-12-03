import { useState, useEffect } from "react";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { 
  getCurrentCalled, 
  getWaitingCount, 
  subscribeToChanges,
  getInitialState,
  QueueTicket 
} from "@/lib/queueStore";
import { announceQueue } from "@/lib/tts";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Users } from "lucide-react";

const Display = () => {
  const [currentCalled, setCurrentCalled] = useState<QueueTicket | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);

  useEffect(() => {
    const state = getInitialState();
    setCurrentCalled(state.currentCalled);
    setWaitingCount(state.tickets.filter(t => t.status === 'waiting').length);
    if (state.currentCalled) {
      setLastCalledId(state.currentCalled.id);
    }

    const unsubscribe = subscribeToChanges(async (state) => {
      const newCalled = state.currentCalled;
      setWaitingCount(state.tickets.filter(t => t.status === 'waiting').length);
      
      // Announce if there's a new number called
      if (newCalled && newCalled.id !== lastCalledId) {
        setCurrentCalled(newCalled);
        setLastCalledId(newCalled.id);
        await announceQueue(newCalled.formattedNumber, newCalled.loket || 1);
      } else if (!newCalled) {
        setCurrentCalled(null);
      }
    });

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [lastCalledId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-navy-dark/80 backdrop-blur-sm border-b-2 border-gold/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <InstitutionLogo size="lg" />
            <div className="text-primary-foreground">
              <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
                KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN
              </h1>
              <p className="text-gold text-lg font-medium">RUTAN KELAS I DEPOK</p>
            </div>
          </div>
          <div className="text-right text-primary-foreground">
            <p className="text-lg">
              {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
            <p className="text-5xl font-mono font-bold text-gold">
              {format(currentTime, "HH:mm:ss")}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Side - Video/Banner Area */}
        <div className="hidden lg:flex w-1/3 p-6 items-center justify-center">
          <div className="bg-card/10 backdrop-blur-md rounded-2xl border border-gold/20 p-8 w-full h-full flex flex-col items-center justify-center">
            <InstitutionLogo size="xl" className="mb-6" />
            <h2 className="text-2xl font-bold text-primary-foreground text-center mb-4">
              LAYANAN KUNJUNGAN
            </h2>
            <p className="text-primary-foreground/70 text-center">
              Silakan menunggu hingga nomor antrian Anda dipanggil
            </p>
            
            <div className="mt-8 bg-gold/10 rounded-xl p-4 w-full">
              <div className="flex items-center justify-center gap-2 text-gold">
                <Users className="w-6 h-6" />
                <span className="text-xl">
                  <strong className="text-3xl">{waitingCount}</strong> menunggu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Queue Display */}
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="bg-card/10 backdrop-blur-md rounded-3xl border-2 border-gold/30 shadow-glow p-8 md:p-12 max-w-2xl w-full">
            {currentCalled ? (
              <div className="text-center fade-in">
                <p className="text-2xl md:text-3xl font-medium text-primary-foreground/70 mb-4">
                  NOMOR ANTRIAN
                </p>
                
                <div className="relative">
                  <div className="font-mono text-[120px] md:text-[180px] font-bold text-gold leading-none tracking-[8px] pulse-glow rounded-3xl py-4">
                    {currentCalled.formattedNumber}
                  </div>
                  <div className="absolute -inset-4 bg-gold/10 rounded-3xl -z-10 blur-xl" />
                </div>

                <div className="mt-8 bg-primary/20 rounded-2xl p-6">
                  <p className="text-xl text-primary-foreground/70">Silakan menuju</p>
                  <p className="text-4xl md:text-6xl font-bold text-primary-foreground mt-2">
                    LOKET <span className="text-gold">{currentCalled.loket}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-3xl text-primary-foreground/50 mb-4">
                  NOMOR ANTRIAN
                </p>
                <div className="font-mono text-[120px] md:text-[180px] font-bold text-primary-foreground/20 leading-none">
                  ---
                </div>
                <p className="text-xl text-primary-foreground/40 mt-8">
                  Menunggu panggilan...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Running Text Footer */}
      <footer className="bg-gold h-16 flex items-center overflow-hidden">
        <div className="whitespace-nowrap running-text">
          <span className="text-navy-dark font-bold text-xl px-8">
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
