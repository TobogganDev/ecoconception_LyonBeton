import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";

import SessionProvider, {
  CartMergeOnLogin,
} from "~/components/SessionProvider";
import { auth } from "~/lib/auth";
import { schedulePyroscopeFlush } from "~/lib/pyroscope-flush";
import { TRPCReactProvider } from "~/trpc/react";
import Header from "./_components/Header/Header";

export const metadata: Metadata = {
  title: "Lyon Béton",
  description: "Lyon Béton — boutique en ligne",
};

const geist = Geist({
  subsets: ["latin"],
});

const skModernist = localFont({
  src: [
    {
      path: "./fonts/SkModernist-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    { path: "./fonts/SkModernist-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/SkModernist-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sk-modernist",
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  schedulePyroscopeFlush();

  return (
    <html lang="fr">
      <body className={`${geist.className} ${skModernist.variable}`}>
        <SessionProvider session={session}>
          <TRPCReactProvider>
            <Header />
            <CartMergeOnLogin />
            {children}
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
