import { Wix_Madefor_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import style from "@/app/(main)/form.module.scss";
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
      <header className={style.header}>
        <Link href="/dashboard">
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL}/media/.thumbswysiwyg/desktop_logo.png`}
            alt={serverLanguage?.logo_alt ?? 'Baseer logo'}
            width={200}
            height={54}
            style={{maxWidth: "auto", maxHeight: "auto"}}
          />
        </Link>
      </header>
      {children}
      <footer className={style.footer}>
        <div className={style.copyright}>
          <p>
            {serverLanguage?.copyright ?? '© 2025'} 
            {/* <span> {serverLanguage?.company_name ?? 'Baseer'}</span>.  */}
                        <span> {serverLanguage?.zaafoo ?? "Zaafoo"}</span>. 

            {serverLanguage?.all_rights_reserved ?? 'All rights reserved'}
          </p>
          <ul>
            <li>
              <Link href={'https://www.zaafoo.com/terms-and-condition'} target="_blank">
                {serverLanguage?.terms ?? 'Terms'}
              </Link>
            </li>
            <li>
              <Link href={'https://www.zaafoo.com/privacy-policy'} target="_blank">
                {serverLanguage?.privacy ?? 'Privacy'}
              </Link>
            </li>
          </ul>
        </div>
        <div className={style.get_help}>
          <p>
            {serverLanguage?.trouble_signing_in ?? 'Having trouble signing in?'} 
            {' '}
            <Link href={'https://www.zaafoo.com/contactus.html/'} target="_blank">
              {serverLanguage?.get_support ?? 'Get Support'}
            </Link>
          </p>
        </div>
      </footer>
    </body>
    </html>
  );
}
