import { useState, useEffect } from "react";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { Button } from "@/components/ui/button";
import { takeNumber, getWaitingCount, subscribeToChanges, ServiceType } from "@/lib/queueStore";
import { printTicketDirectly } from "@/lib/printTicket";
import { UserPlus, MessageCircleQuestion, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const Kiosk = () => {
  const [waitingCountA, setWaitingCountA] = useState(0);
  const [waitingCountB, setWaitingCountB] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setWaitingCountA(getWaitingCount('A'));
    setWaitingCountB(getWaitingCount('B'));
    
    const unsubscribe = subscribeToChanges((state) => {
      setWaitingCountA(state.tickets.filter(t => t.status === 'waiting' && t.serviceType === 'A').length);
      setWaitingCountB(state.tickets.filter(t => t.status === 'waiting' && t.serviceType === 'B').length);
    });

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleTakeNumber = (serviceType: ServiceType) => {
    const ticket = takeNumber(serviceType);
    printTicketDirectly(ticket);
  };

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

        <div className="bg-card/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-gold/30 shadow-glow max-w-3xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              PILIH LAYANAN
            </h2>
            <p className="text-primary-foreground/70">
              Silakan pilih layanan dan ambil nomor antrian Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Layanan Pendaftaran Kunjungan */}
            <div className="bg-card/10 rounded-xl p-6 border border-gold/20">
              <Button
                onClick={() => handleTakeNumber('A')}
                className="w-full h-32 md:h-40 text-lg md:text-xl font-bold bg-gradient-to-br from-gold to-gold-dark hover:from-gold-light hover:to-gold text-navy-dark rounded-xl shadow-elevated transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-3"
              >
                <UserPlus className="w-10 h-10 md:w-12 md:h-12" />
                <span className="leading-tight">LAYANAN<br/>PENDAFTARAN<br/>KUNJUNGAN</span>
              </Button>
              <div className="mt-4 flex items-center justify-center gap-2 text-primary-foreground/70">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  <strong className="text-gold">{waitingCountA}</strong> orang menunggu
                </span>
              </div>
              <p className="text-center text-primary-foreground/50 text-xs mt-2">
                Loket 1, 2, 3
              </p>
            </div>

            {/* Layanan Informasi dan Pengaduan */}
            <div className="bg-card/10 rounded-xl p-6 border border-gold/20">
              <Button
                onClick={() => handleTakeNumber('B')}
                className="w-full h-32 md:h-40 text-lg md:text-xl font-bold bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white rounded-xl shadow-elevated transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-3"
              >
                <MessageCircleQuestion className="w-10 h-10 md:w-12 md:h-12" />
                <span className="leading-tight">LAYANAN<br/>INFORMASI &<br/>PENGADUAN</span>
              </Button>
              <div className="mt-4 flex items-center justify-center gap-2 text-primary-foreground/70">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  <strong className="text-emerald-400">{waitingCountB}</strong> orang menunggu
                </span>
              </div>
              <p className="text-center text-primary-foreground/50 text-xs mt-2">
                Loket 4
              </p>
            </div>
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
