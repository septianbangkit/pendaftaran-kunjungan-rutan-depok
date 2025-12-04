import { QueueTicket } from "./queueStore";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const printTicketDirectly = (ticket: QueueTicket) => {
  const printWindow = window.open('', '', 'width=302,height=500');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Tiket Antrian</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', sans-serif; 
              width: 80mm; 
              padding: 4mm;
              background: white;
            }
            .ticket { text-align: center; }
            .header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .logo { 
              width: 40px; 
              height: 40px; 
              border-radius: 50%;
              background: linear-gradient(135deg, hsl(43 74% 49%), hsl(43 75% 40%));
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .institution { text-align: left; }
            .institution-name { font-size: 9px; font-weight: 700; line-height: 1.2; }
            .branch { font-size: 8px; font-weight: 500; color: #666; }
            .datetime { font-size: 10px; margin: 8px 0; color: #666; }
            .title { font-size: 12px; font-weight: 600; margin: 8px 0; }
            .number { 
              font-family: 'JetBrains Mono', monospace; 
              font-size: 56px; 
              font-weight: 700; 
              letter-spacing: 4px; 
              margin: 8px 0; 
            }
            .barcode { margin: 8px 0; }
            .barcode svg { width: 100%; max-width: 180px; height: 40px; }
            .service { font-size: 11px; font-weight: 600; margin: 8px 0; letter-spacing: 1px; }
            .thanks { font-size: 9px; font-style: italic; color: #888; margin-top: 8px; }
            .divider { border-top: 1px dashed #ccc; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="logo">
                <svg viewBox="0 0 100 100" width="28" height="28" fill="none">
                  <path d="M50 5 L85 25 L85 60 Q85 85 50 95 Q15 85 15 60 L15 25 Z" fill="#1a2744" stroke="#b8860b" stroke-width="2"/>
                  <path d="M50 20 L53 30 L64 30 L55 37 L59 48 L50 41 L41 48 L45 37 L36 30 L47 30 Z" fill="#c9a227"/>
                  <rect x="35" y="52" width="30" height="28" fill="#c9a227" rx="2"/>
                  <rect x="40" y="57" width="6" height="8" fill="#1a2744" rx="1"/>
                  <rect x="54" y="57" width="6" height="8" fill="#1a2744" rx="1"/>
                  <rect x="45" y="68" width="10" height="12" fill="#1a2744" rx="1"/>
                  <path d="M30 54 L50 40 L70 54" stroke="#c9a227" stroke-width="3" fill="none" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="institution">
                <div class="institution-name">KEMENTERIAN IMIGRASI</div>
                <div class="institution-name">DAN PEMASYARAKATAN</div>
                <div class="branch">RUTAN KELAS I DEPOK</div>
              </div>
            </div>
            <div class="datetime">
              ${format(ticket.createdAt, "EEEE, dd MMMM yyyy", { locale: id })}<br/>
              ${format(ticket.createdAt, "HH:mm:ss")} WIB
            </div>
            <div class="divider"></div>
            <div class="title">Nomor Antrian</div>
            <div class="number">${ticket.formattedNumber}</div>
            <div class="barcode">
              <svg viewBox="0 0 200 40">
                ${generateBarcodeLines(ticket.id)}
              </svg>
            </div>
            <div class="divider"></div>
            <div class="service">LAYANAN KUNJUNGAN</div>
            <div class="thanks">~Terimakasih Telah Menunggu~</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after a small delay for fonts to load
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }
};

// Simple barcode generator (Code128-like visual)
const generateBarcodeLines = (id: string): string => {
  const lines: string[] = [];
  let x = 10;
  const chars = id.split('');
  
  chars.forEach((char, i) => {
    const code = char.charCodeAt(0);
    const widths = [
      (code % 3) + 1,
      ((code >> 2) % 2) + 1,
      ((code >> 4) % 3) + 1,
      ((code >> 6) % 2) + 1,
    ];
    
    widths.forEach((w, j) => {
      if (j % 2 === 0) {
        lines.push(`<rect x="${x}" y="0" width="${w}" height="40" fill="black"/>`);
      }
      x += w + 1;
    });
  });
  
  return lines.join('');
};
