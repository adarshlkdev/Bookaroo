import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transpoter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "OTP for verification",
    text: `Your OTP is ${otp}.It will expire in 10 minutes`,
  };

  try {
    await transpoter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error(error);
  }
};

export const sendVerificationEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Account Verification",
    text: "Your account has been successfully verified",
  };

  try {
    await transpoter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error(error);
  }
};

export const sendBookingConfirmation = async (email, invoiceUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Booking Confirmation",
    html: `<p>Please find your invoice at the following link:</p><a href="${invoiceUrl}">Download Invoice</a>`,
  };

  try {
    await transpoter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error) {
    console.error(error);
  }
};
