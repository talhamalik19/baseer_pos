import { fetchLanguageData } from '@/lib/Magento/actions';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Utility to check file existence
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Read JSON from file
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return null;
  }
}

// Write JSON to file
async function saveJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving JSON file:', error);
  }
}

// Fetch CSV translations from Magento
async function fetchCSVTranslations(storeId, jwtToken) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rest/V1/store-csv/download?storeId=${storeId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const result = await response.json();
    return result?.[0]?.success ? result?.[0]?.data : null;
  } catch (error) {
    console.error('Failed to fetch CSV translations:', error);
    return null;
  }
}

// Main LanguageProvider function
export default async function LanguageProvider(adminStores = null) {
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get('jwt')?.value;

  // ✅ Get store info from cookies (already set by page.js)
  const storeIdFromCookie = cookieStore.get('store_id')?.value;
  const storeCodeFromCookie = cookieStore.get('store_code')?.value;
  const storeNameFromCookie = cookieStore.get('store')?.value;

  const translationsDir = path.join(process.cwd(), 'translations');
  await fs.mkdir(translationsDir, { recursive: true });

  // ✅ Fetch fresh store list
  let languageData = await fetchLanguageData();
  if (!Array.isArray(languageData)) {
    languageData = [];
  }

  // ✅ Filter stores based on admin details
  let allowedStores = languageData;

  // If adminStores is passed explicitly, use it
  let userStores = adminStores;

  // If not passed and we have a token, fetch it
  if (!userStores && jwtToken) {
    try {
      const { getAdminDetail } = await import('@/lib/Magento');
      const adminDetail = await getAdminDetail();
      if (adminDetail?.data?.data?.stores) {
        userStores = adminDetail.data.data.stores;
      }
    } catch (error) {
      console.error("Failed to fetch admin details in LanguageProvider:", error);
    }
  }

  // Filter if we have a list of allowed stores
  if (userStores && Array.isArray(userStores) && userStores.length > 0) {
    const allowedStoreIds = new Set(userStores.map(s => s.store_id?.toString()));
    allowedStores = languageData.filter(store => allowedStoreIds.has(store.id?.toString()));
  }

  // ✅ Find the store that matches our cookies
  let selectedStore = null;

  if (storeIdFromCookie) {
    selectedStore = allowedStores.find(store => store.id?.toString() === storeIdFromCookie);
  }
  if (!selectedStore && storeCodeFromCookie) {
    selectedStore = allowedStores.find(store => store.store_code === storeCodeFromCookie);
  }
  if (!selectedStore && storeNameFromCookie) {
    selectedStore = allowedStores.find(store => store.store_name === storeNameFromCookie);
  }

  // If still no store found, use first allowed store
  if (!selectedStore) {
    selectedStore = allowedStores.find(store => store.is_default_store) || allowedStores[0];
  }

  const storeId = selectedStore?.id || null;
  const storeCode = selectedStore?.store_code || 'en_US';
  const storeName = selectedStore?.store_name || 'English US';
  const storeLocale = selectedStore?.locale || 'en_US';

  // ✅ Load or fetch CSV translations
  let csvTranslations = {};
  if (storeId && jwtToken) {
    const csvFilePath = path.join(translationsDir, `store_${storeId}_translations.json`);
    if (await fileExists(csvFilePath)) {
      const cachedCSV = await readJsonFile(csvFilePath);
      if (cachedCSV && cachedCSV.__storeId?.toString() === storeId.toString()) {
        csvTranslations = { ...cachedCSV };
        delete csvTranslations.__storeId;
        delete csvTranslations.__cachedAt;
      }
    }

    if (Object.keys(csvTranslations).length === 0) {
      const freshCSV = await fetchCSVTranslations(storeId, jwtToken);
      if (freshCSV) {
        await saveJsonFile(csvFilePath, {
          ...freshCSV,
          __storeId: storeId,
          __cachedAt: new Date().toISOString()
        });
        csvTranslations = freshCSV;
      }
    }
  }

  // ✅ Final return: selected store and all stores
  return {
    storeId,
    storeCode,
    storeName,
    storeLocale,
    selectedStore,
    allStores: allowedStores,
    csvTranslations,
  };
}