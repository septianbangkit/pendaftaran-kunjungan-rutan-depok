import { useState, useEffect, useRef, useCallback } from "react";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { 
  subscribeToChanges,
  getInitialState,
  QueueTicket,
  CalledByLoket,
  callNext,
  recallCurrent,
  markServed,
  getCalledByLoket,
  resetQueue,
  isLastWaiting,
  getWaitingTickets
} from "@/lib/queueStore";
import { announceQueue, announceQueueEmpty } from "@/lib/tts";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Users, Play } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Display = () => {
  const [calledByLoket, setCalledByLoket] = useState<CalledByLoket>({ 1: null, 2: null, 3: null, 4: null });
  const [waitingA, setWaitingA] = useState<QueueTicket[]>([]);
  const [waitingB, setWaitingB] = useState<QueueTicket[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showResetDialog, setShowResetDialog] = useState(false);
  const lastCalledRef = useRef<{ [key: number]: string | null }>({ 1: null, 2: null, 3: null, 4: null });

  const handleResetConfirm = () => {
    resetQueue();
    setShowResetDialog(false);
  };

  // Keyboard handler for loket controls
  const handleKeyPress = useCallback(async (e: KeyboardEvent) => {
    const key = e.key;
    
    // Tombol 0 - Reset antrian
    if (key === '0') {
      setShowResetDialog(true);
      return;
    }
    
    // Tombol 1, 2, 3 - Call next untuk loket 1, 2, 3 (antrian A)
    if (['1', '2', '3'].includes(key)) {
      const loket = parseInt(key) as 1 | 2 | 3;
      const current = getCalledByLoket(loket);
      
      if (current) {
        markServed(loket);
      }
      
      const ticket = callNext(loket);
      if (ticket) {
        await announceQueue(ticket.formattedNumber, loket);
        
        if (isLastWaiting('A')) {
          setTimeout(() => {
            announceQueueEmpty();
          }, 2500);
        }
      } else {
        announceQueueEmpty();
      }
    }
    
    // Tombol 4 - Call next untuk loket 4 (antrian B)
    if (key === '4') {
      const current = getCalledByLoket(4);
      
      if (current) {
        markServed(4);
      }
      
      const ticket = callNext(4);
      if (ticket) {
        await announceQueue(ticket.formattedNumber, 4);
        
        if (isLastWaiting('B')) {
          setTimeout(() => {
            announceQueueEmpty();
          }, 2500);
        }
      } else {
        announceQueueEmpty();
      }
    }
    
    // Tombol 7, 8, 9 - Recall untuk loket 1, 2, 3
    if (['7', '8', '9'].includes(key)) {
      const loket = (parseInt(key) - 6) as 1 | 2 | 3;
      const ticket = recallCurrent(loket);
      if (ticket) {
        await announceQueue(ticket.formattedNumber, loket);
      }
    }
    
    // Tombol 6 - Recall untuk loket 4
    if (key === '6') {
      const ticket = recallCurrent(4);
      if (ticket) {
        await announceQueue(ticket.formattedNumber, 4);
      }
    }
  }, []);

  useEffect(() => {
    const state = getInitialState();
    setCalledByLoket(state.calledByLoket);
    setWaitingA(getWaitingTickets('A'));
    setWaitingB(getWaitingTickets('B'));
    
    // Initialize last called IDs
    for (let i = 1; i <= 4; i++) {
      const loketKey = i as 1 | 2 | 3 | 4;
      lastCalledRef.current[i] = state.calledByLoket[loketKey]?.id || null;
    }

    const unsubscribe = subscribeToChanges(async (state) => {
      setCalledByLoket(state.calledByLoket);
      setWaitingA(state.tickets.filter(t => t.status === 'waiting' && t.serviceType === 'A'));
      setWaitingB(state.tickets.filter(t => t.status === 'waiting' && t.serviceType === 'B'));
      
      for (let i = 1; i <= 4; i++) {
        const loketKey = i as 1 | 2 | 3 | 4;
        const newCalled = state.calledByLoket[loketKey];
        const lastId = lastCalledRef.current[i];
        
        if (newCalled && newCalled.id !== lastId) {
          lastCalledRef.current[i] = newCalled.id;
        } else if (!newCalled) {
          lastCalledRef.current[i] = null;
        }
      }
    });

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      unsubscribe();
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const LoketCard = ({ loket, ticket, serviceLabel }: { loket: number; ticket: QueueTicket | null; serviceLabel?: string }) => (
    <div 
      className={`bg-card/10 backdrop-blur-md rounded-xl border-2 p-3 transition-all duration-300 flex-1 flex flex-col justify-center ${
        ticket 
          ? 'border-gold shadow-glow animate-pulse-slow' 
          : 'border-primary-foreground/20'
      }`}
    >
      <div className="text-center">
        {serviceLabel && (
          <p className="text-xs text-primary-foreground/50 mb-1 truncate">{serviceLabel}</p>
        )}
        <h3 className="text-sm font-bold text-primary-foreground/70 mb-1">
          LOKET {loket}
        </h3>
        
        {ticket ? (
          <>
            <div className="font-mono text-4xl md:text-5xl font-bold text-gold leading-none my-2">
              {ticket.formattedNumber}
            </div>
            <div className="bg-gold/20 rounded-lg px-2 py-1 inline-block">
              <span className="text-gold font-medium text-xs">Memanggil...</span>
            </div>
          </>
        ) : (
          <>
            <div className="font-mono text-4xl md:text-5xl font-bold text-primary-foreground/20 leading-none my-2">
              ---
            </div>
            <div className="bg-primary-foreground/10 rounded-lg px-2 py-1 inline-block">
              <span className="text-primary-foreground/40 text-xs">Standby</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const WaitingList = ({ title, tickets, colorClass }: { title: string; tickets: QueueTicket[]; colorClass: string }) => (
    <div className="bg-card/10 backdrop-blur-md rounded-xl border border-gold/20 p-3 flex-1">
      <h4 className={`text-sm font-bold ${colorClass} mb-2 text-center`}>{title}</h4>
      <div className="flex flex-wrap gap-1 justify-center max-h-20 overflow-y-auto">
        {tickets.length > 0 ? (
          tickets.slice(0, 15).map(t => (
            <span key={t.id} className="bg-primary-foreground/10 text-primary-foreground/70 text-xs px-2 py-1 rounded font-mono">
              {t.formattedNumber}
            </span>
          ))
        ) : (
          <span className="text-primary-foreground/40 text-xs">Tidak ada antrian</span>
        )}
        {tickets.length > 15 && (
          <span className="text-primary-foreground/50 text-xs">+{tickets.length - 15} lainnya</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-navy border-gold/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary-foreground">
              Reset Antrian
            </AlertDialogTitle>
            <AlertDialogDescription className="text-primary-foreground/70">
              Apakah Anda yakin ingin mereset antrian? Semua nomor antrian akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
              No
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-navy-dark/80 backdrop-blur-sm border-b-2 border-gold/30 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InstitutionLogo size="md" />
              <div className="text-primary-foreground">
                <h1 className="text-lg md:text-xl font-bold tracking-wide">
                  KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN
                </h1>
                <p className="text-gold text-sm font-medium">RUTAN KELAS I DEPOK</p>
              </div>
            </div>
            <div className="text-right text-primary-foreground">
              <p className="text-xs md:text-sm">
                {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
              </p>
              <p className="text-3xl md:text-4xl font-mono font-bold text-gold">
                {format(currentTime, "HH:mm:ss")}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex p-3 gap-3">
          {/* Left Side - Video/Banner Area */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex-1 bg-card/10 backdrop-blur-md rounded-xl border border-gold/20 overflow-hidden relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-dark/50">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-3">
                  <Play className="w-8 h-8 text-gold" />
                </div>
                <p className="text-primary-foreground/50 text-sm">Video / Banner Area</p>
              </div>
            </div>
            
            {/* Waiting Lists */}
            <div className="flex gap-3">
              <WaitingList 
                title="Antrian Pendaftaran Kunjungan" 
                tickets={waitingA} 
                colorClass="text-gold"
              />
              <WaitingList 
                title="Antrian Informasi & Pengaduan" 
                tickets={waitingB} 
                colorClass="text-emerald-400"
              />
            </div>
          </div>

          {/* Right Side - 4 Loket Cards */}
          <div className="w-72 lg:w-80 flex flex-col gap-2">
            {/* Service Label for Loket 1, 2, 3 */}
            <div className="text-center bg-gold/20 rounded-lg py-1 px-2">
              <span className="text-gold text-xs font-semibold">Layanan Pendaftaran Kunjungan</span>
            </div>
            <LoketCard loket={1} ticket={calledByLoket[1]} />
            <LoketCard loket={2} ticket={calledByLoket[2]} />
            <LoketCard loket={3} ticket={calledByLoket[3]} />
            
            {/* Service Label for Loket 4 */}
            <div className="text-center bg-emerald-500/20 rounded-lg py-1 px-2 mt-1">
              <span className="text-emerald-400 text-xs font-semibold">Layanan Informasi & Pengaduan</span>
            </div>
            <LoketCard loket={4} ticket={calledByLoket[4]} />
          </div>
        </main>

        {/* Running Text Footer */}
        <footer className="bg-gold h-12 flex items-center overflow-hidden">
          <div className="whitespace-nowrap running-text">
            <span className="text-navy-dark font-bold text-base px-8">
              KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN — RUTAN KELAS I DEPOK — LAYANAN KUNJUNGAN — 
              SILAKAN MENUNGGU DENGAN TERTIB — TERIMA KASIH ATAS KUNJUNGAN ANDA —
              KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN — RUTAN KELAS I DEPOK — LAYANAN KUNJUNGAN — 
              SILAKAN MENUNGGU DENGAN TERTIB — TERIMA KASIH ATAS KUNJUNGAN ANDA —
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Display;
