const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 10000;

// Parse JSON body
app.use(bodyParser.json({ limit: "10mb" }));

// Serve static files
app.use("/index", express.static(path.join(__dirname, "public/index")));
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

// Setup file paths
const submissionsFile = path.join(__dirname, "submissions.json");
const pdfFolder = path.join(__dirname, "pdfs");

// Buat folder jika belum ada
if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder);

// Baca fail submissions.json
let existing = [];
if (fs.existsSync(submissionsFile)) {
  try {
    existing = JSON.parse(fs.readFileSync(submissionsFile));
  } catch (err) {
    console.error("Error baca JSON:", err);
    fs.writeFileSync(submissionsFile, JSON.stringify([]));
    existing = [];
  }
} else {
  fs.writeFileSync(submissionsFile, JSON.stringify([]));
}

// API submit form
app.post("/submit", async (req, res) => {
  const { name, ic, email, phone, address,position, signature } = req.body;
  const timestamp = Date.now();
  const filename = `${name.replace(/\s+/g, "_")}_${timestamp}.pdf`;
  const pdfPath = path.join(pdfFolder, filename);

  const newSubmission = {
    name,
    ic,
    email,
    phone,
    address,
    position,
    signature,
    timestamp,
    pdfPath,
  };

  // Simpan data
  existing.push(newSubmission);
  fs.writeFileSync(submissionsFile, JSON.stringify(existing, null, 2));

  // Simpan signature sementara
  const signatureData = signature.replace(/^data:image\/png;base64,/, "");
  const signatureBuffer = Buffer.from(signatureData, "base64");
  const signaturePath = path.join(__dirname, "signature_temp.png");
  fs.writeFileSync(signaturePath, signatureBuffer);

  // Buat PDF
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  doc.fontSize(16).text("Maklumat Pelanggan", { underline: true });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Nama: ${name}`);
  doc.text(`No. IC: ${ic}`);
  doc.text(`Emel: ${email}`);
  doc.text(`Telefon: ${phone}`);
  doc.text(`jawatan: ${position}`);
  doc.text(`Alamat: ${address}`);
  doc.moveDown();
  doc.text("Tandatangan:");
  doc.image(signaturePath, { width: 300 });

  doc.end();

  stream.on("finish", async () => {
    fs.unlinkSync(signaturePath); // Padam temp

    // Hantar emel
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "syafri.unicorn@gmail.com",
        pass: "khqb mnzt orjo wwyz", // App password
      },
    });

    const mailOptions = {
      from: "Borang Tandatangan <syafri.unicorn@gmail.com>",
      to: email,
      bcc: "syafri.unicorn@gmail.com", // Admin dapat juga
      subject: "Salinan Borang Tandatangan Anda",
      html: `<p>Terima kasih ${name}, borang anda telah diterima.</p><p>Sila lihat salinan dalam fail PDF dilampirkan.</p>`,
      attachments: [{ filename, path: pdfPath }],
    };

    try {
      await transporter.sendMail(mailOptions);
      res.send("Maklumat berjaya dihantar dan PDF telah diemel!");
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).send("Ralat semasa menghantar emel.");
    }
  });
});

// API untuk memuat turun PDF
app.get("/download/:pdfPath", (req, res) => {
  const { pdfPath } = req.params;
  const filePath = path.join(pdfFolder, pdfPath);

  if (fs.existsSync(filePath)) {
    res.download(filePath); // Muat turun PDF
  } else {
    res.status(404).send("PDF tidak dijumpai.");
  }
});

// Redirect root (/) ke /index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index/index.html'));
});


// Jalankan server
app.listen(PORT, () => {
  console.log(`✅ Server running:
📄 Borang: http://localhost:${PORT}/index

});
