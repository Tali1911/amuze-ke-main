import QRCode from "qrcode";
import jsPDF from "jspdf";
import { CampRegistration } from "@/types/campRegistration";

// Brand colors derived from src/index.css design tokens
const BRAND = {
  primary: [56, 138, 77] as [number, number, number],        // forest green
  primaryDark: [38, 96, 54] as [number, number, number],
  secondary: [195, 158, 90] as [number, number, number],     // earth tone
  accent: [85, 182, 237] as [number, number, number],        // sky blue
  ink: [30, 41, 59] as [number, number, number],             // foreground
  muted: [100, 116, 139] as [number, number, number],
  surface: [241, 245, 244] as [number, number, number],
  border: [220, 226, 222] as [number, number, number],
  paid: [22, 138, 74] as [number, number, number],
  unpaid: [217, 119, 6] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const setFill = (pdf: jsPDF, c: [number, number, number]) => pdf.setFillColor(c[0], c[1], c[2]);
const setText = (pdf: jsPDF, c: [number, number, number]) => pdf.setTextColor(c[0], c[1], c[2]);
const setDraw = (pdf: jsPDF, c: [number, number, number]) => pdf.setDrawColor(c[0], c[1], c[2]);

export const qrCodeService = {
  async generateQRCode(qrCodeData: string): Promise<string> {
    try {
      return await QRCode.toDataURL(qrCodeData, {
        width: 320,
        margin: 1,
        color: { dark: "#1f3d2b", light: "#FFFFFF" },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  },

  generateQRCodeData(registrationId: string): string {
    return JSON.stringify({
      type: "camp_registration",
      id: registrationId,
      timestamp: Date.now(),
    });
  },

  parseQRCodeData(qrCodeData: string): { type: string; id: string; timestamp: number } | null {
    try {
      return JSON.parse(qrCodeData);
    } catch {
      return null;
    }
  },

  /**
   * Generate a branded PDF that matches the Amuse Kenya website theme.
   */
  async generateRegistrationPDF(
    registration: CampRegistration,
    qrCodeDataUrl: string,
    type: "invoice" | "receipt",
  ): Promise<Blob> {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const isPaid = type === "receipt";

    // ===== Header band =====
    setFill(pdf, BRAND.primary);
    pdf.rect(0, 0, pageW, 34, "F");
    // Accent stripe
    setFill(pdf, BRAND.secondary);
    pdf.rect(0, 34, pageW, 2, "F");

    setText(pdf, BRAND.white);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("Amuse Kenya", margin, 16);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Bush Camp • Adventures • Learning", margin, 22);

    // Document title (right aligned)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    const title = isPaid ? "PAYMENT RECEIPT" : "REGISTRATION INVOICE";
    pdf.text(title, pageW - margin, 16, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const issued = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
    pdf.text(`Issued: ${issued}`, pageW - margin, 22, { align: "right" });
    if (registration.registration_number) {
      pdf.text(`Ref: ${registration.registration_number}`, pageW - margin, 27, { align: "right" });
    }

    // ===== Status pill =====
    let y = 46;
    const statusLabel = isPaid ? "PAID" : (registration.payment_status || "UNPAID").toUpperCase();
    const statusColor = isPaid || registration.payment_status === "paid" ? BRAND.paid : BRAND.unpaid;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    const pillW = pdf.getTextWidth(statusLabel) + 10;
    setFill(pdf, statusColor);
    (pdf as any).roundedRect(margin, y - 5, pillW, 7.5, 2, 2, "F");
    setText(pdf, BRAND.white);
    pdf.text(statusLabel, margin + 5, y);

    // Camp type tag
    const campTag = registration.camp_type.replace(/-/g, " ").toUpperCase();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const tagW = pdf.getTextWidth(campTag) + 8;
    setFill(pdf, BRAND.surface);
    setDraw(pdf, BRAND.border);
    (pdf as any).roundedRect(margin + pillW + 4, y - 5, tagW, 7.5, 2, 2, "FD");
    setText(pdf, BRAND.primaryDark);
    pdf.text(campTag, margin + pillW + 8, y);

    // ===== Parent / Contact card =====
    y += 10;
    setDraw(pdf, BRAND.border);
    setFill(pdf, BRAND.surface);
    (pdf as any).roundedRect(margin, y, pageW - margin * 2, 30, 3, 3, "FD");

    setText(pdf, BRAND.primaryDark);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Parent / Guardian", margin + 5, y + 7);

    setText(pdf, BRAND.ink);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const colW = (pageW - margin * 2 - 10) / 2;
    pdf.text(`Name:  ${registration.parent_name}`, margin + 5, y + 14);
    pdf.text(`Email: ${registration.email}`, margin + 5, y + 20);
    pdf.text(`Phone: ${registration.phone}`, margin + 5, y + 26);
    if (registration.location) {
      pdf.text(`Location: ${registration.location}`, margin + 5 + colW, y + 14);
    }
    if (registration.emergency_contact) {
      pdf.text(`Emergency: ${registration.emergency_contact}`, margin + 5 + colW, y + 20);
    }
    pdf.text(`Method: ${(registration.payment_method || "pending").toUpperCase()}`, margin + 5 + colW, y + 26);

    // ===== Children section =====
    y += 38;
    setText(pdf, BRAND.primaryDark);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Registered Children", margin, y);
    setDraw(pdf, BRAND.primary);
    pdf.setLineWidth(0.6);
    pdf.line(margin, y + 1.5, margin + 55, y + 1.5);
    pdf.setLineWidth(0.2);

    y += 6;
    registration.children.forEach((child, index) => {
      const sessionsDisplay = Array.isArray(child.selectedSessions)
        ? child.selectedSessions.join(", ")
        : Object.entries(child.selectedSessions as Record<string, "half" | "full">)
            .map(([d, s]) => `${d}: ${s === "half" ? "Half Day" : "Full Day"}`)
            .join("  •  ");
      const datesDisplay = (child.selectedDates && child.selectedDates.length)
        ? child.selectedDates.join(", ")
        : (child.selectedDays || []).join(", ");

      // Card
      const cardH = 26;
      setFill(pdf, BRAND.white);
      setDraw(pdf, BRAND.border);
      (pdf as any).roundedRect(margin, y, pageW - margin * 2, cardH, 2.5, 2.5, "FD");

      // Index badge
      setFill(pdf, BRAND.primary);
      (pdf as any).roundedRect(margin + 3, y + 3, 8, 8, 1.5, 1.5, "F");
      setText(pdf, BRAND.white);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(String(index + 1), margin + 7, y + 8.8, { align: "center" });

      // Child name + age
      setText(pdf, BRAND.ink);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(child.childName, margin + 14, y + 7);
      setText(pdf, BRAND.muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Age group: ${child.ageRange}`, margin + 14, y + 12);

      // Price (right)
      setText(pdf, BRAND.primaryDark);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`KES ${Number(child.price).toLocaleString()}`, pageW - margin - 4, y + 8, { align: "right" });

      // Dates / Sessions
      setText(pdf, BRAND.ink);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      const datesLine = pdf.splitTextToSize(`Dates: ${datesDisplay || "—"}`, pageW - margin * 2 - 18);
      pdf.text(datesLine.slice(0, 1), margin + 14, y + 18);
      const sessionsLine = pdf.splitTextToSize(`Sessions: ${sessionsDisplay || "—"}`, pageW - margin * 2 - 18);
      pdf.text(sessionsLine.slice(0, 1), margin + 14, y + 23);

      y += cardH + 3;

      if (y > pageH - 80) {
        pdf.addPage();
        y = margin + 4;
      }
    });

    // ===== Total card =====
    y += 4;
    setFill(pdf, BRAND.primary);
    (pdf as any).roundedRect(margin, y, pageW - margin * 2, 16, 3, 3, "F");
    setText(pdf, BRAND.white);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("TOTAL AMOUNT", margin + 5, y + 10);
    pdf.setFontSize(15);
    pdf.text(
      `KES ${Number(registration.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      pageW - margin - 5,
      y + 10.5,
      { align: "right" },
    );
    y += 22;

    // Payment details (receipt only)
    if (isPaid && registration.payment_reference) {
      setText(pdf, BRAND.muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Payment reference: ${registration.payment_reference}`, margin, y);
      y += 6;
    }

    // ===== QR Code panel =====
    if (y > pageH - 70) {
      pdf.addPage();
      y = margin + 4;
    }
    const qrPanelH = 58;
    setFill(pdf, BRAND.surface);
    setDraw(pdf, BRAND.border);
    (pdf as any).roundedRect(margin, y, pageW - margin * 2, qrPanelH, 3, 3, "FD");

    const qrSize = 46;
    const qrX = margin + 6;
    const qrY = y + 6;
    setFill(pdf, BRAND.white);
    (pdf as any).roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "F");
    pdf.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    setText(pdf, BRAND.primaryDark);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Quick Check-in QR Code", qrX + qrSize + 8, y + 14);
    setText(pdf, BRAND.ink);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const note = pdf.splitTextToSize(
      "Present this QR code at the camp gate for instant check-in. Keep this document safe — it contains your registration reference.",
      pageW - margin * 2 - qrSize - 18,
    );
    pdf.text(note, qrX + qrSize + 8, y + 22);

    if (!isPaid) {
      setText(pdf, BRAND.unpaid);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Payment pending", qrX + qrSize + 8, y + 44);
      setText(pdf, BRAND.muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("Pay online via My Registrations or at the camp gate.", qrX + qrSize + 8, y + 49);
    } else {
      setText(pdf, BRAND.paid);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Payment received — thank you!", qrX + qrSize + 8, y + 44);
    }

    // ===== Footer =====
    setFill(pdf, BRAND.primaryDark);
    pdf.rect(0, pageH - 16, pageW, 16, "F");
    setText(pdf, BRAND.white);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("Thank you for choosing Amuse Kenya", margin, pageH - 9);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("info@amusekenya.co.ke  •  www.amusekenya.co.ke", margin, pageH - 4);
    pdf.text(
      `Page ${pdf.getNumberOfPages()}`,
      pageW - margin,
      pageH - 6,
      { align: "right" },
    );

    return pdf.output("blob");
  },

  downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
