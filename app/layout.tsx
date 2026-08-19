import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Libre_Caslon_Text, Public_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/role";
import { prisma } from "@/lib/prisma";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const display = Libre_Caslon_Text({
  variable: "--font-app-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const sans = Public_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Registry — Student Management System",
    template: "%s · Registry",
  },
  description:
    "Enrolment, fees, assessments and results for the Registry team and the students they keep records for.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf1ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1211" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const students = await prisma.student.findMany({
    orderBy: { studentId: "asc" },
    select: { id: true, studentId: true, fullName: true },
  });

  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <AppShell session={session} students={students}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
