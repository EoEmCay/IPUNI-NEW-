const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'khoile3006.official@gmail.com',
    pass: 'pykj aizq klwb lvdd', 
  },
});
console.log("Sending...");
transporter.sendMail({
  from: '"DIA+" <khoile3006.official@gmail.com>',
  to: 'lekhoi947@yahoo.com',
  subject: 'Test',
  text: 'Test',
}).then(info => console.log("Sent", info)).catch(console.error);
