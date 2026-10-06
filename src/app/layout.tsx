import type { Metadata } from "next";
import "@fontsource/anton/400.css";
import "@fontsource/pinyon-script/400.css";
import "@fontsource-variable/jost";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CurrencyProvider } from "@/components/Currency";
import { site } from "@/config/site";


export const metadata: Metadata = {
  title: `${site.consultant} · ${site.brand}`,
  description: `Vastu for your home, office or factory, in ${site.consultant}'s five-element method. Free element check, AI floor-plan reports, and online or in-person consultations.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen flex flex-col">
        <CurrencyProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </CurrencyProvider>
      </body>
    </html>
  );
}
