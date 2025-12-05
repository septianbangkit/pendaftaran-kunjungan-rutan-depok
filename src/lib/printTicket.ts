import { QueueTicket } from "./queueStore";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import jsPDF from "jspdf";

export const printTicketDirectly = (ticket: QueueTicket) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 120]
  });

  const centerX = 40;
  
  // Header - Institution
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('KEMENTERIAN IMIGRASI', centerX, 10, { align: 'center' });
  doc.text('DAN PEMASYARAKATAN', centerX, 14, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('RUTAN KELAS I DEPOK', centerX, 19, { align: 'center' });
  
  // Datetime
  doc.setFontSize(8);
  doc.text(format(ticket.createdAt, "EEEE, dd MMMM yyyy", { locale: id }), centerX, 28, { align: 'center' });
  doc.text(format(ticket.createdAt, "HH:mm:ss") + " WIB", centerX, 33, { align: 'center' });
  
  // Divider (dashed line using dots)
  doc.setDrawColor(150);
  for (let i = 10; i < 70; i += 2) {
    doc.line(i, 38, i + 1, 38);
  }
  
  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nomor Antrian', centerX, 46, { align: 'center' });
  
  // Queue Number - Large
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.formattedNumber, centerX, 68, { align: 'center' });
  
  // Barcode placeholder (simple lines)
  const barcodeY = 75;
  const barcodeWidth = 50;
  const startX = centerX - barcodeWidth / 2;
  doc.setDrawColor(0);
  
  for (let i = 0; i < 30; i++) {
    const x = startX + (i * 1.7);
    const width = (ticket.id.charCodeAt(i % ticket.id.length) % 2) + 0.5;
    doc.setLineWidth(width);
    doc.line(x, barcodeY, x, barcodeY + 12);
  }
  
  // Divider (dashed line using dots)
  doc.setLineWidth(0.1);
  for (let i = 10; i < 70; i += 2) {
    doc.line(i, 92, i + 1, 92);
  }
  
  // Service type
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const serviceName = ticket.serviceType === 'A' 
    ? 'LAYANAN PENDAFTARAN KUNJUNGAN' 
    : 'LAYANAN INFORMASI & PENGADUAN';
  doc.text(serviceName, centerX, 100, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('~Terimakasih Telah Menunggu~', centerX, 108, { align: 'center' });
  
  // Auto download
  doc.save(`tiket-antrian-${ticket.formattedNumber}.pdf`);
};
