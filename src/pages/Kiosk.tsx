import { useState, useEffect } from "react";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { QueueTicket } from "@/components/QueueTicket";
import { Button } from "@/components/ui/button";
import { takeNumber, getWaitingCount, QueueTicket as QueueTicketType, subscribeToChanges, getInitialState } from "@/lib/queueStore";
import { Ticket, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const Kiosk = () => {
  const [currentTicket, setCurrentTicket] = useState<QueueTicketType | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setWaitingCount(getWaitingCount());
    
    const unsubscribe = subscribeToChanges((state) => {
      setWaitingCount(state.tickets.filter(t => t.status === 'waiting').length);
    });

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleTakeNumber = () => {
    const ticket = takeNumber();
    setCurrentTicket(ticket);
    setWaitingCount(getWaitingCount());
  };

  const handleBack = () => {
    setCurrentTicket(null);
  };

  if (currentTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-background flex flex-col items-center justify-center p-6">
        <div className="fade-in">
          <QueueTicket ticket={currentTicket} onPrint={handleBack} />
        </div>
        <Button 
          variant="outline" 
          className="mt-6 no-print"
          onClick={handleBack}
        >
          Ambil Nomor Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex flex-col">
      {/* Header */}
      <header className="bg-navy-dark/50 backdrop-blur-sm border-b border-gold/20 p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <InstitutionLogo size="lg" />
          <div className="text-primary-foreground">
            <h1 className="text-xl md:text-2xl font-bold">
              KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN
            </h1>
            <p className="text-gold font-medium">RUTAN KELAS I DEPOK</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <p className="text-gold text-lg mb-2">
            {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
          <p className="text-primary-foreground/80 text-4xl font-mono font-bold">
            {format(currentTime, "HH:mm:ss")}
          </p>
        </div>

        <div className="bg-card/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-gold/30 shadow-glow max-w-lg w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              LAYANAN KUNJUNGAN
            </h2>
            <p className="text-primary-foreground/70">
              Silakan ambil nomor antrian Anda
            </p>
          </div>

          <Button
            onClick={handleTakeNumber}
            className="w-full h-24 md:h-32 text-xl md:text-2xl font-bold bg-gradient-to-br from-gold to-gold-dark hover:from-gold-light hover:to-gold text-navy-dark rounded-xl shadow-elevated transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-pulse-scale"
          >
            <Ticket className="w-8 h-8 md:w-10 md:h-10 mr-3" />
            AMBIL NOMOR ANTRIAN
          </Button>

          <div className="mt-8 flex items-center justify-center gap-2 text-primary-foreground/70">
            <Users className="w-5 h-5" />
            <span>
              <strong className="text-gold">{waitingCount}</strong> orang sedang menunggu
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-dark/50 backdrop-blur-sm border-t border-gold/20 p-4">
        <p className="text-center text-primary-foreground/50 text-sm">
          Sistem Antrian Digital - Kementerian Imigrasi dan Pemasyarakatan
        </p>
      </footer>
    </div>
  );
};

export default Kiosk;
