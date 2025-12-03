import { Link } from "react-router-dom";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Users, Monitor, ArrowRight } from "lucide-react";

const Index = () => {
  const menuItems = [
    {
      title: "Kiosk Antrian",
      description: "Ambil nomor antrian untuk pengunjung",
      icon: Ticket,
      href: "/kiosk",
      color: "from-gold to-gold-dark",
    },
    {
      title: "Panel Petugas",
      description: "Kelola dan panggil nomor antrian",
      icon: Users,
      href: "/staff",
      color: "from-primary to-navy-light",
    },
    {
      title: "Display Antrian",
      description: "Tampilan layar untuk ruang tunggu",
      icon: Monitor,
      href: "/display",
      color: "from-navy-light to-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Header */}
      <header className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <InstitutionLogo size="xl" className="shadow-glow" />
          <div className="text-primary-foreground">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
              KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN
            </h1>
            <p className="text-gold text-xl font-medium mt-2">RUTAN KELAS I DEPOK</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pb-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
            Sistem Antrian Digital
          </h2>
          <p className="text-primary-foreground/70 text-lg">
            Layanan Kunjungan
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href} className="group">
              <Card className="h-full bg-card/10 backdrop-blur-md border-gold/20 hover:border-gold/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1">
                <CardHeader className="text-center pb-2">
                  <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-elevated group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-primary-foreground text-xl">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-primary-foreground/60 mb-4">
                    {item.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    className="border-gold/30 text-gold hover:bg-gold hover:text-navy-dark group-hover:border-gold"
                  >
                    Buka
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-card/10 backdrop-blur-md border-gold/20">
            <CardHeader>
              <CardTitle className="text-primary-foreground text-lg">Cara Penggunaan</CardTitle>
            </CardHeader>
            <CardContent className="text-primary-foreground/70 space-y-2 text-sm">
              <p>1. <strong className="text-gold">Kiosk</strong> - Pengunjung ambil nomor antrian</p>
              <p>2. <strong className="text-gold">Panel Petugas</strong> - Petugas memanggil nomor</p>
              <p>3. <strong className="text-gold">Display</strong> - Tampilkan di TV ruang tunggu</p>
            </CardContent>
          </Card>

          <Card className="bg-card/10 backdrop-blur-md border-gold/20">
            <CardHeader>
              <CardTitle className="text-primary-foreground text-lg">Fitur Sistem</CardTitle>
            </CardHeader>
            <CardContent className="text-primary-foreground/70 space-y-2 text-sm">
              <p>✓ Cetak tiket thermal 58mm/80mm</p>
              <p>✓ Panggilan suara otomatis (TTS)</p>
              <p>✓ Sinkronisasi real-time antar layar</p>
              <p>✓ Reset otomatis setiap hari</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-dark/50 backdrop-blur-sm border-t border-gold/20 p-6">
        <p className="text-center text-primary-foreground/50 text-sm">
          © 2024 Sistem Antrian Digital - Kementerian Imigrasi dan Pemasyarakatan
        </p>
      </footer>
    </div>
  );
};

export default Index;
