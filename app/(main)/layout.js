import { Inter, Wix_Madefor_Display } from "next/font/google";
import "@/styles/global.scss";
import { ContextProvider } from "@/context/SidebarContext";
import SideBar from "@/components/blocks/SideBar";
import SyncHandler from "@/components/SyncHandler";
import "@/styles/theme.scss"


const wixMadeForDisplay = Wix_Madefor_Display({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

export const metadata = {
  title: 'Baseer POS',
  description: 'Streamline your sales with our advanced Point of Sale (POS) system. Track inventory, manage transactions, and enhance customer experience with seamless, secure, and efficient POS software.',
}

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
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </head>
      <body className={`${inter?.className} body`}>
        <ContextProvider>
          <SyncHandler />
          <div className="main_container">
            <div className="page_content">
              <SideBar />
              <div className="main_section">
                {children}
              </div>
            </div>
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}
