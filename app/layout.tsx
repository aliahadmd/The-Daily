import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/public/NavBar";
import Footer from "@/components/public/Footer";
import { getCategories } from "@/lib/queries/taxonomy";
import { getTags } from "@/lib/queries/taxonomy";
import { getCountries } from "@/lib/queries/taxonomy";
import { getUserSession } from "@/lib/user-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Daily — International News",
  description: "All the news that's fit to print. Breaking news, world coverage, and in-depth reporting.",
  openGraph: {
    title: "The Daily — International News",
    description: "All the news that's fit to print.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [[categories, tags, countries], user] = await Promise.all([
    Promise.all([getCategories(), getTags(), getCountries()]),
    getUserSession(),
  ]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cream`}
      >
        <NavBar categories={categories} user={user} />
        {children}
        <Footer categories={categories} tags={tags} countries={countries} />
      </body>
    </html>
  );
}
