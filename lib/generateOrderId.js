export const generateOrderId = (code) => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `POS_${code}_${random}`;
  };