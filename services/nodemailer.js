const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.MAILER_EMAIL,
    clientId: process.env.MAILER_CLIENT_ID,
    clientSecret: process.env.MAILER_CLIENT_SECRET,
    refreshToken: process.env.MAILER_REFTKN,
    accessToken: process.env.MAILER_ACCTKN,
    expires: 1484314697598,
  },
});
