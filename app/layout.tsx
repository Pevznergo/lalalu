import "./styles.css";
import type { Metadata } from "next";
import { MixpanelAnalytics } from "./MixpanelAnalytics";

export const metadata: Metadata = {
  title: "lalalu",
  description: "Birthday song generator"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <MixpanelAnalytics />
        {children}
      </body>
    </html>
  );
}
