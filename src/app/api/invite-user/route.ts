import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    let adminId = cookieStore.get('session_user')?.value;
    
    // Fallback: If logged in via Google, fetch from NextAuth session
    if (!adminId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (dbUser) adminId = dbUser.id;
      }
    }

    if (!adminId) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    const admin = await prisma.user.findUnique({ 
      where: { id: adminId },
      include: { organization: true }
    });

    if (!admin || admin.role !== 'ADMIN' || !admin.organizationId) {
      return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
    }

    const formData = await request.formData();
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;

    if (!email || !role) {
      return NextResponse.redirect(new URL('/dashboard?error=missing_fields', request.url));
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const inviteUrl = `http://localhost:3001/auth/accept-invite?token=${token}`;
    
    // Create the invitation linked to the Admin's organization
    await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        organizationId: admin.organizationId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      }
    });

    // --- EMAIL NOTIFICATION LOGIC ---
    let transporter;
    
    // If you have provided real Gmail SMTP credentials in .env, use them to send REAL emails.
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Otherwise, fallback to the Ethereal testing sandbox
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const senderEmail = process.env.SMTP_EMAIL || '"ProcureFlow Notifications" <noreply@procureflow.com>';

    let info = await transporter.sendMail({
      from: senderEmail,
      to: email,
      subject: `You have been invited to join ${admin.organization?.name} on ProcureFlow!`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a;">Join ${admin.organization?.name}</h2>
          <p style="color: #475569;">You have been invited by an Admin to join their workspace as a <strong>${role}</strong>.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 7 days.</p>
        </div>
      `,
    });

    console.log("-----------------------------------------");
    console.log("EMAIL SENT! Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");

    // Redirect back to dashboard with success query param (instead of logging out)
    return NextResponse.redirect(new URL(`/dashboard?invite=success&email=${encodeURIComponent(email)}`, request.url), 303);

  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.redirect(new URL('/dashboard?error=server_error', request.url));
  }
}
