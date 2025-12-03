import { useState, useEffect } from "react";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  callNext, 
  recallCurrent, 
  skipCurrent, 
  markServed,
  getCurrentCalled,
  getWaitingCount,
  subscribeToChanges,
  getInitialState,
  QueueTicket
} from "@/lib/queueStore";
import { announceQueue } from "@/lib/tts";
import { 
  Phone, 
  PhoneForwarded, 
  SkipForward, 
  CheckCircle, 
  Users,
  Volume2,
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const StaffPanel = () => {
  const [selectedLoket, setSelectedLoket] = useState("1");
  const [currentCalled, setCurrentCalled] = useState<QueueTicket | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const state = getInitialState();
    setCurrentCalled(state.currentCalled);
    setWaitingCount(state.tickets.filter(t => t.status === 'waiting').length);

    const unsubscribe = subscribeToChanges((state) => {
      setCurrentCalled(state.currentCalled);
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

  const handleCallNext = async () => {
    const loket = parseInt(selectedLoket);
    const ticket = callNext(loket);
    
    if (ticket) {
      setCurrentCalled(ticket);
      if (isSoundEnabled) {
        await announceQueue(ticket.formattedNumber, loket);
      }
      toast({
        title: "Nomor Dipanggil",
        description: `Nomor ${ticket.formattedNumber} menuju Loket ${loket}`,
      });
    } else {
      toast({
        title: "Tidak Ada Antrian",
        description: "Semua antrian sudah dilayani",
        variant: "destructive",
      });
    }
  };

  const handleRecall = async () => {
    const loket = parseInt(selectedLoket);
    const ticket = recallCurrent(loket);
    
    if (ticket) {
      if (isSoundEnabled) {
        await announceQueue(ticket.formattedNumber, loket);
      }
      toast({
        title: "Panggil Ulang",
        description: `Nomor ${ticket.formattedNumber} dipanggil ulang`,
      });
    }
  };

  const handleSkip = () => {
    if (skipCurrent()) {
      setCurrentCalled(null);
      toast({
        title: "Nomor Dilewati",
        description: "Nomor antrian telah dilewati",
      });
    }
  };

  const handleServed = () => {
    if (markServed()) {
      setCurrentCalled(null);
      toast({
        title: "Selesai Dilayani",
        description: "Pengunjung telah selesai dilayani",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-elevated">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InstitutionLogo size="md" />
            <div>
              <h1 className="text-lg font-bold">Panel Petugas</h1>
              <p className="text-sm text-gold">RUTAN Kelas I Depok</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-foreground/70">
              {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
            <p className="text-xl font-mono font-bold">
              {format(currentTime, "HH:mm:ss")}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Queue Card */}
          <Card className="shadow-elevated border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center justify-between">
                <span>Nomor Saat Ini</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  title={isSoundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
                >
                  {isSoundEnabled ? (
                    <Volume2 className="w-5 h-5 text-primary" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {currentCalled ? (
                <div className="text-center">
                  <div className="font-mono text-7xl md:text-8xl font-bold text-primary mb-4 pulse-glow rounded-xl py-6">
                    {currentCalled.formattedNumber}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Loket <span className="font-bold text-gold text-2xl">{currentCalled.loket}</span>
                  </p>
                  {currentCalled.calledAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Dipanggil: {format(currentCalled.calledAt, "HH:mm:ss")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl font-mono text-muted-foreground">---</p>
                  <p className="text-muted-foreground mt-2">Belum ada nomor dipanggil</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls Card */}
          <Card className="shadow-elevated">
            <CardHeader className="bg-primary/5">
              <CardTitle>Kontrol Antrian</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Loket Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Pilih Loket</label>
                <Select value={selectedLoket} onValueChange={setSelectedLoket}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Loket" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Loket {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleCallNext}
                  className="h-16 text-lg bg-primary hover:bg-primary/90"
                  disabled={waitingCount === 0}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Panggil
                </Button>

                <Button
                  onClick={handleRecall}
                  variant="outline"
                  className="h-16 text-lg border-2 border-gold text-gold hover:bg-gold hover:text-navy-dark"
                  disabled={!currentCalled}
                >
                  <PhoneForwarded className="w-5 h-5 mr-2" />
                  Ulang
                </Button>

                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="h-16 text-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={!currentCalled}
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Lewati
                </Button>

                <Button
                  onClick={handleServed}
                  className="h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
                  disabled={!currentCalled}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Selesai
                </Button>
              </div>

              {/* Waiting Count */}
              <div className="bg-muted rounded-lg p-4 flex items-center justify-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <span className="text-lg">
                  Menunggu: <strong className="text-2xl text-primary">{waitingCount}</strong> orang
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Hari Ini", value: getInitialState().currentNumber, color: "primary" },
            { label: "Menunggu", value: waitingCount, color: "gold" },
            { label: "Terlayani", value: getInitialState().tickets.filter(t => t.status === 'served').length, color: "green-600" },
            { label: "Dilewati", value: getInitialState().tickets.filter(t => t.status === 'skipped').length, color: "destructive" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StaffPanel;
