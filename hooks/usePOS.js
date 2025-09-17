import { useState, useEffect } from 'react';
import POSService from '../services/posService';

const usePOS = (apiBaseUrl) => {
  const [posService] = useState(() => new POSService(apiBaseUrl));
  const [posDetails, setPosDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePOS = async () => {
      try {
        setLoading(true);
        const details = await posService.getPOSDetails();
        setPosDetails(details);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializePOS();
  }, [posService]);

  const placeOrder = async (orderData) => {
    try {
      setLoading(true);
      const result = await posService.placeOrder(orderData);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshPOSDetails = async () => {
    try {
      setLoading(true);
      const details = await posService.fetchAndSavePOSDetails();
      setPosDetails(details);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    posDetails,
    loading,
    error,
    placeOrder,
    refreshPOSDetails
  };
};

export default usePOS; 