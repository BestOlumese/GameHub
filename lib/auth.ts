import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { emailOTP } from "better-auth/plugins";
import { transporter } from "./mailer";
import { otpEmailTemplate } from "@/emailTemp/otpEmail";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    nextCookies(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          await transporter.sendMail({
            from: `"GameHub" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your login otp code",
            html: otpEmailTemplate(otp),
          });
        }
      },
    }),
  ],
});
