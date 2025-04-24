const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "syafri.unicorn@gmail.com", // Gantikan dengan emel anda
    pass: "khqb mnzt orjo wwyz",       // Gantikan dengan Gmail App Password
  },
});

const mailOptions = {
  from: '"Test Email" <syafri.unicorn@gmail.com>',
  to: "syafri.unicorn@gmail.com", // Emel sendiri dulu untuk test
  subject: "Ujian Penghantaran Emel",
  text: "Ini hanyalah ujian penghantaran email dari Nodemailer!",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log("❌ Ralat:", error);
  }
  console.log("✅ Emel berjaya dihantar:", info.response);
});
