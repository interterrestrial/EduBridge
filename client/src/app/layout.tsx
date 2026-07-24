import type { Metadata } from "next";
import { Varela, Hanuman } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const varela = Varela({
  weight: "400",
  variable: "--font-varela",
  subsets: ["latin"],
});

const hanuman = Hanuman({
  weight: ["400", "700", "900"],
  variable: "--font-hanuman",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduBridge",
  description: "Personalized learning with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${varela.variable} ${hanuman.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <GoogleOAuthProvider clientId="105438668399-k5srfr3lr7fvl26on2mi0nqfqt2l4oo4.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
