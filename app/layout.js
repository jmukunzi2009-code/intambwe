import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "INTAMBWE | Leadership begins with a step forward",
  description: "Youth Leadership Development, Digital Education, Community Engagement and Conference Management platform.",
  keywords: ["youth leadership", "Rwanda", "education", "student conferences", "mentorship", "INTAMBWE", "Irakoze Sarah Divine"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
