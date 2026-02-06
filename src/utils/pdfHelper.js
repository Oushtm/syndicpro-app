import { jsPDF } from "jspdf";

export const COMPANY_COLOR = "#6b66ff";
export const TEXT_COLOR = "#1e293b";
export const TEXT_MUTED = "#64748b";

// URL to a base64 encoded font or a direct TTF file
// For this implementation, we will fetch the TTF buffer directly
const AMIRI_FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf";

export const loadArabicFont = async (doc) => {
    try {
        const response = await fetch(AMIRI_FONT_URL);
        const buffer = await response.arrayBuffer();
        const fontFileName = "Amiri-Regular.ttf";

        // Convert array buffer to base64 string for jsPDF
        const base64String = arrayBufferToBase64(buffer);

        doc.addFileToVFS(fontFileName, base64String);
        doc.addFont(fontFileName, "Amiri", "normal");
        doc.addFont(fontFileName, "Amiri", "bold"); // Register same font for bold to prevent fallback
        doc.setFont("Amiri");
        return true;
    } catch (error) {
        console.error("Failed to load Arabic font:", error);
        return false;
    }
};

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export const addHeader = (doc, title, subtitle, isRTL) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Logo / Brand
    doc.setFontSize(24);
    doc.setTextColor(COMPANY_COLOR);
    doc.setFont("Amiri", "bold"); // Assuming bold is available or mapping normal to bold
    // Note: JS PDF font mapping usually requires bold variant file, forcing normal for now if not loaded

    const xPos = isRTL ? pageWidth - margin : margin;
    const align = isRTL ? 'right' : 'left';

    doc.text(title, xPos, 20, { align });

    doc.setFontSize(10);
    doc.setTextColor(TEXT_MUTED);
    doc.text(subtitle, xPos, 28, { align });

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 35, pageWidth - margin, 35);
};

export const addFooter = (doc, pageNum, totalPages) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(150);

    const footerText = `SyndicPro Management System - Page ${pageNum} of ${totalPages}`;
    const dateText = `Generated on ${new Date().toLocaleDateString()}`;

    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(dateText, pageWidth / 2, pageHeight - 6, { align: 'center' });
};
