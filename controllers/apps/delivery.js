const mailTransporter = require("../../services/nodemailer");

exports.mailer = async (req, res, next) => {
  try {
    await mailTransporter.sendMail({
      from: "kibisama9@gmail.com",
      to: "kibisama9@gmail.com",
      subject: "테스트",
      html: `
        <div>
            <h2>${"test"}<h2>
            test!
        </div>
        `,
    });
    res.send("OK");
  } catch (e) {
    console.log(e);
    next(e);
  }
};
