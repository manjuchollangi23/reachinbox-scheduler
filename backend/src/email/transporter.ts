import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'ethereal.user') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Create a test account dynamically if not configured
    const testAccount = await nodemailer.createTestAccount();
    console.log(`Created Ethereal Test Account: ${testAccount.user} / ${testAccount.pass}`);
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
};
