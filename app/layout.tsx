import "./styles.css";
import type { Metadata } from "next";
import { MixpanelAnalytics } from "./MixpanelAnalytics";

export const metadata: Metadata = {
  title: "lalelu",
  description: "A birthday song generator that turns stories into custom songs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MixpanelAnalytics />
        {children}
      </body>
    </html>
  );
}
