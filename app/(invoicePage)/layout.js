import { Wix_Madefor_Display } from "next/font/google";
import "@/styles/global.scss"
import LanguageProvider from "@/components/global/LanguageProvider";

const wixMadeForDisplay = Wix_Madefor_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Baseer POS",
  description:
    "Streamline your sales with our advanced Point of Sale (POS) system. Track inventory, manage transactions, and enhance customer experience with seamless, secure, and efficient POS software.",
};

export default async function RootLayout({ children }) {
  const langugae = await LanguageProvider()
  const serverLanguage = langugae?.csvTranslations;
  return (
    <html lang="en">
   <body className={wixMadeForDisplay?.className}>
      {children}
    </body>
    </html>
  );
}
