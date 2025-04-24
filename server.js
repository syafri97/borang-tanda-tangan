const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const app = express();
const PORT = 3000;

app.use(bodyParser.json({ limit: "10mb" }));
app.use("/index", express.static(path.join(__dirname, "public/index")));
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

const submissionsFile = path.join(__dirname, "submissions.json");
const pdfFolder = path.join(__dirname, "pdfs");

// Cek jika folder pdf wujud, kalau tak wujud, buatkan
if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder);

// Langkah 2: Memastikan fail submissions.json sah
let existing = [];
if (fs.existsSync(submissionsFile)) {
  try {
    // Cuba membaca dan parse fail submissions.json
    existing = JSON.parse(fs.readFileSync(submissionsFile));
  } catch (err) {
    console.error("Error membaca JSON:", err);
    // Jika ada ralat dalam membaca JSON, kosongkan fail dan set existing ke array kosong
    fs.writeFileSync(submissionsFile, JSON.stringify([]));
    existing = [];
  }
} else {
  // Jika fail tidak wujud, buatkan fail kosong
  fs.writeFileSync(submissionsFile, JSON.stringify([]));
}

app.post("/submit", async (req, res) => {
  const { name, ic, email, phone, address, signature } = req.body;

  const timestamp = Date.now();
  const filename = `${name.replace(/\s+/g, "_")}_${timestamp}.pdf`;
  const pdfPath = path.join(pdfFolder, filename);

  const newSubmission = {
    name,
    ic,
    email,
    phone,
    address,
    signature,
    timestamp,
    pdfPath,
  };

  // Simpan ke submissions.json
  existing.push(newSubmission);
  fs.writeFileSync(submissionsFile, JSON.stringify(existing, null, 2));

  // Simpan signature ke fail sementara
  const signatureData = signature.replace(/^data:image\/png;base64,/, "");
  const signatureBuffer = Buffer.from(signatureData, "base64");
  const signaturePath = path.join(__dirname, "signature_temp.png");
  fs.writeFileSync(signaturePath, signatureBuffer);

  // Hasilkan PDF
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
  doc.text(`Alamat: ${address}`);
  doc.moveDown();
  doc.text("Tandatangan:");
  doc.image(signaturePath, { width: 300 });

  doc.end();

  stream.on("finish", async () => {
    // Padam signature temp
    fs.unlinkSync(signaturePath);

    // Emel PDF
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "syafri.unicorn@gmail.com",
        pass: "nwfc vlin iejw fvfw", // App password
      },
    });

    const mailOptions = {
      from: "Borang Tandatangan <syafri.unicorn@gmail.com>",
      to: email,
      subject: "Salinan Borang Tandatangan Anda",
      html: `<p>Terima kasih ${name}, borang anda telah diterima.</p><p>Sila lihat salinan dalam fail PDF dilampirkan.</p>`,
      attachments: [
        {
          filename,
          path: pdfPath,
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);
      res.send("Maklumat berjaya dihantar dan PDF telah diemel!");
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).send("Ralat semasa menghantar emel.");
    }
    app.listen(PORT, () =>
      console.log(`Server running: http://localhost:${PORT}/index`)
    );
    
  });
});
