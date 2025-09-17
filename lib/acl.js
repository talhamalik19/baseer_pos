// import { loadPosData } from "./posStorage";

export const permissionMap = {
  Dashboard: 'dashboard_view',
  Settings: 'settings_view',
  Employees: 'employees_view',
  "Add New Employees": "add_employees",
  
  Account: 'account',
  View: 'pos_view',
  "POS Information": "manage_pos",
  "POS Configuration": 'settings_customization',
  'Get POS Details': 'settings_view',

  Catalog: 'catalog_manage',
  Sales: 'sales_process',
  Orders: 'orders_view',
  Customers: 'customers_manage',
  "Report": 'reports_view',
  Suspend: 'orders_suspend'
};

export const getPOSData = async () => {
  try {
    const loginDetail = JSON.parse(localStorage.getItem('loginDetail'));
    const jsonData = JSON.parse(localStorage.getItem("jsonData"))
    if(jsonData?.acl){
      return jsonData
    }
    else return loginDetail;

    // const fileData = await loadPosData(); 
    // if (fileData) {
    //   localStorageData.setItem('pos_code', JSON.parse(fileData?.pos_code))
    //   localStorage.setItem('pos_data', JSON.stringify(fileData));
    //   return fileData;
    // }
    
    return null;
  } catch (error) {
    console.error('Error loading POS data:', error);
    return null;
  }
};

export const hasPermission = async (permissionKey) => {
  const posData = await getPOSData();
  // return posData?.admin_acl?.[permissionKey] || false;
};

export const checkPOSCodeExists = async () => {
  try {
    // Check if POS code already exists in localStorage
    if (localStorage.getItem('pos_code')) return true;

    // If not in localStorage, load from file
    // const fileData = await loadPosData();

    // if (fileData?.pos_code) {
    //   localStorage.setItem('pos_code', fileData.pos_code);
    //   localStorage.setItem('pos_data', JSON.stringify(fileData));
    //   return true;
    // }

    return false;
  } catch (error) {
    console.error('Error checking POS existence:', error);
    return false;
  }
};


export const isSuperAdmin = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("role") !== 'admin';
  }
  return false;
};
