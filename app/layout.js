import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
