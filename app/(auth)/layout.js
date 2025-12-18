import { Inter, Wix_Madefor_Display } from "next/font/google";
import Link from "next/link";
import style from "@/app/(main)/form.module.scss";
import "@/styles/global.scss";
import LanguageProvider from "@/components/global/LanguageProvider";
import "@/styles/theme.scss";
import Logo from "@/components/global/Logo";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister/ServiceWorkerRegister";

const wixMadeForDisplay = Wix_Madefor_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Baseer POS",
  description:
    "Streamline your sales with our advanced Point of Sale (POS) system. Track inventory, manage transactions, and enhance customer experience with seamless, secure, and efficient POS software.",
  manifest: "/manifest.json",
};
const setInitialTheme = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('theme');
        const theme = savedTheme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (_) {}
    })();
  `;
export default async function RootLayout({ children }) {
  const langugae = await LanguageProvider();
  const serverLanguage = langugae?.csvTranslations;
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />

      </head>
      <body className={inter?.className}>
        <ServiceWorkerRegister />
        <div className={style.page}>
          <div className={style.header}>
            <Logo
              lightSrc={`${process.env.NEXT_PUBLIC_API_URL}/media/.thumbswysiwyg/desktop_logo.png`}
              darkSrc={`${process.env.NEXT_PUBLIC_API_URL}/media/.thumbswysiwyg/baseer_logo_dark.png`}
            />
          </div>
          {children}
        </div>

        <footer className={style.footer}>
          <div className={style.copyright}>
            <p>
              {serverLanguage?.copyright ?? "© 2025"}
              {/* <span> {serverLanguage?.company_name ?? 'Baseer'}</span>.  */}
              <Link href={'https://juicestation.com.pk/'}> {serverLanguage?.juicestation ?? "JuiceStation"}</Link>.
              {serverLanguage?.all_rights_reserved ?? "All rights reserved"}
            </p>
            <ul>
              <li>
                <Link
                  href={"https://juicestation.com.pk/termscondition"}
                  target="_blank"
                >
                  {serverLanguage?.terms ?? "Terms"}
                </Link>
              </li>
              {/* <li>
                <Link
                  href={"https://www.zaafoo.com/privacy-policy"}
                  target="_blank"
                >
                  {serverLanguage?.privacy ?? "Privacy"}
                </Link>
              </li> */}
            </ul>
          </div>
          <div className={style.get_help}>
            <p>
              {serverLanguage?.trouble_signing_in ??
                "Having trouble signing in?"}{" "}
              <Link
                href={"https://juicestation.com.pk/contactus"}
                target="_blank"
              >
                {serverLanguage?.get_support ?? "Get Support"}
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
