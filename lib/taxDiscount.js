export  const getTaxRate = (paymentMethod) => {
    return paymentMethod === "cashondelivery" ? 18 : 5; // 18% for cash, 5% for card
  };

 export const calculateTaxAndDiscount = (item, basePrice, discountedPrice = null, paymentMethod="cash") => {
    // Guard against null basePrice
    if (!basePrice || basePrice <= 0) {
      return {
        basePrice: 0,
        discountAmount: 0,
        taxAmount: 0,
        finalTotal: 0,
        taxRate: getTaxRate(),
      };
    }

    const apply_tax_after_discount = item?.apply_tax_after_discount;
    const discount_including_tax = item?.discount_including_tax;
    const taxRate = getTaxRate(paymentMethod);
    const finalPrice = discountedPrice || basePrice;
    let discountAmount = 0;
    let taxAmount = 0;
    let finalTotal = finalPrice;
    // Calculate discount amount if price was changed
    if (discountedPrice && discountedPrice < basePrice) {
      discountAmount = basePrice - discountedPrice;
    }

    // Rule 1: apply_tax_after_discount = 0, discount_including_tax = 0
    if (apply_tax_after_discount === 0 && discount_including_tax === 0) {
      taxAmount = (basePrice * taxRate) / 100;
      finalTotal = basePrice + taxAmount;
    }
    // Rule 2: apply_tax_after_discount = 1, discount_including_tax = 0
    else if (apply_tax_after_discount === 1 && discount_including_tax === 0) {
      taxAmount = ((finalPrice) * taxRate) / 100;
      finalTotal = finalPrice + taxAmount;
    }
    // Rule 3: apply_tax_after_discount = 0, discount_including_tax = 1
    else if (apply_tax_after_discount === 0 && discount_including_tax === 1) {
      taxAmount = (basePrice * taxRate) / 100;
      finalTotal = basePrice + taxAmount;
    }
    // Rule 4: apply_tax_after_discount = 1, discount_including_tax = 1
    else if (apply_tax_after_discount === 1 && discount_including_tax === 1) {
      taxAmount = (basePrice * taxRate) / 100;
      const discountedPriceBeforeTax = finalPrice;
      const discountOnTax = (taxAmount * discountAmount) / basePrice;
      finalTotal = discountedPriceBeforeTax + (taxAmount - discountOnTax);
    }

    return {
      basePrice,
      discountAmount,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      taxRate,
    };
  };