'use client';

import { useEffect, useState } from 'react';

export default function ClientPOSWrapper({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render nothing or a loader on server
    return null; 
  }

  return children;
}