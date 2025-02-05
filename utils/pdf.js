import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cloudinary } from "./clodinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define styles
const styles = {
  title: { fontSize: 24, color: "blue", align: "center" },
  subtitle: { fontSize: 16, color: "darkgreen", underline: true },
  text: { fontSize: 14, color: "black" },
  ticketText: { fontSize: 12, color: "black" },
  totalAmount: { fontSize: 14, color: "red", align: "right" },
  footer: { fontSize: 10, color: "gray", align: "center" },
  margin: 50,
};

export const generateInvoice = async (booking, event) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: styles.margin });
      const filePath = path.join(
        __dirname,
        `../public/invoices/${booking._id}.pdf`
      );
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Title
      doc
        .fillColor(styles.title.color)
        .fontSize(styles.title.fontSize)
        .text("Booking Invoice", { align: styles.title.align });
      doc.moveDown(1);

      // Booking Details
      doc
        .fillColor(styles.text.color)
        .fontSize(styles.text.fontSize)
        .text(`Booking ID: ${booking._id}`, { underline: true });
      doc.text(`Event: ${event.title}`);
      doc.text(`Email: ${booking.user.email}`);
      doc.moveDown(1);

      // Tickets Section
      doc
        .fillColor(styles.subtitle.color)
        .fontSize(styles.subtitle.fontSize)
        .text("Tickets:", { underline: styles.subtitle.underline });
      doc.moveDown(0.5);

      // Draw a border for the tickets section
      const startY = doc.y;
      const ticketSectionWidth = 500;
      const ticketSectionHeight = booking.tickets.length * 20 + 20; // Adjust height based on ticket count
      doc.rect(50, startY, ticketSectionWidth, ticketSectionHeight).stroke();

      // List tickets
      doc
        .fillColor(styles.ticketText.color)
        .fontSize(styles.ticketText.fontSize);
      booking.tickets.forEach((ticket, index) => {
        doc.text(
          `${index + 1}. ${ticket.ticketType} - Quantity: ${
            ticket.quantity
          } - Price: $${ticket.price.toFixed(2)}`
        );
      });

      doc.moveDown(1);

      // Total Amount
      doc
        .fillColor(styles.totalAmount.color)
        .fontSize(styles.totalAmount.fontSize)
        .text(`Total Amount: $${booking.totalAmount.toFixed(2)}`, {
          align: styles.totalAmount.align,
        });

      // Footer
      doc.moveDown(2);
      doc
        .fillColor(styles.footer.color)
        .fontSize(styles.footer.fontSize)
        .text("Thank you for your booking!", { align: styles.footer.align });

      doc.end();

      writeStream.on("finish", async () => {
        try {
          const result = await cloudinary.uploader.upload(filePath, {
            folder: "invoices",
            resource_type: "raw", // Use raw for non-image files
          });
          fs.unlinkSync(filePath); // Remove local file after upload
          resolve(result.secure_url); // Return the URL of uploaded file
        } catch (uploadError) {
          reject(uploadError);
        }
      });

      writeStream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
