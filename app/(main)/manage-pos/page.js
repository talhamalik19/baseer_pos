import PageHead from "@/components/global/PageHead";
import { getAdminDetail } from "@/lib/Magento";
import { cookies, headers } from "next/headers";
import RegisterPOS from "@/components/blocks/RegisterPOS";
import { networkInterfaces } from 'os'; // Use Node.js built-in os module
import { getWarehouseCodes } from "@/lib/Magento/restAPI";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
// import { loadPosData } from "@/lib/posStorage";

// Function to get IP address using Node.js built-in methods
function getIpAddress() {
  try {
    const nets = networkInterfaces();
    const results = {};

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (loopback) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      }
    }
    
    // Return the first IPv4 address found
    for (const [, addresses] of Object.entries(results)) {
      if (addresses.length > 0) {
        return addresses[0];
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting IP address:", error);
    return null;
  }
}

// Function to get MAC address using Node.js built-in methods
function getMacAddress() {
  try {
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (loopback) addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.mac;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting MAC address:", error);
    return null;
  }
}

export default async function Customization({ searchParams }) {
  const params = await searchParams;
  const redirectSource = params?.register;
  const pos_code = params?.pos_code;
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname, username } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  // Get IP and MAC address
  const ipAddress = getIpAddress();
  const macAddress = getMacAddress();

  // const data = await loadPosData();
  const codes = await getWarehouseCodes(username)
    const serverCurrency = await CurrencyProvider()
    const serverLanguage = await LanguageProvider()

    return (
    <>
      <PageHead
        pageName={serverLanguage?.csvTranslations?.connect_pos ?? "Connect POS"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />

      <RegisterPOS 
      jwt={jwt}
        macAddress={macAddress} 
        ipAddress={ipAddress} 
        redirectSource={redirectSource}
        pos_code={pos_code}
        codes={codes}
        serverLanguage={serverLanguage?.csvTranslations}
      />
    </>
  );
}