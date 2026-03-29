import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hypotheken App – GHF & NHG Berekeningen",
  description: "Bereken uw maximale hypotheek op basis van GHF-normen en NHG, inclusief ondernemersinkomen en documentbeheer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
