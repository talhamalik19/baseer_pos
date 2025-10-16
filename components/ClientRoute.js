'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkPOSCodeExists, getPOSData, isSuperAdmin } from  "@/lib/acl" // Update path
// Make sure `requiredPermission` is passed as a prop or from context

export default function ClientRoute({ children,requiredPermission }) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const validateAccess = async () => {
      const exists = await checkPOSCodeExists();
      const posData = await getPOSData();
      const superAdmin = isSuperAdmin();

      if (!exists) {
        router.replace('/manage-pos');
        return;
      }

      // if (!posData) {
      //   router.replace('/auth/login');
      //   return;
      // }
      console.log(posData.admin_acl?.[requiredPermission])
      if (
        !superAdmin &&
        requiredPermission &&
        (!posData.admin_acl?.[requiredPermission] &&
         !posData.acl?.[requiredPermission])
      ) {
        router.replace('/sale');
        return;
      }

      setAllowed(true);
      setLoading(false);
    };

    validateAccess();
  }, [requiredPermission, router]);

  if (loading) return null;

  return allowed ? children : null;
}
