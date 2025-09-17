export const getFilteredProducts = (products = [], searchTerm) => {
 const filteredProducts = products.filter((product) => {
  const name = (product?.name || product?.title || "").toLowerCase();
  const sku = (product?.sku || "").toLowerCase();

  const qrcodeAttr = product?.custom_attributes?.find(
    (item) => item?.attribute_code === "qrcode"
  );
  const qrcode = (qrcodeAttr?.attribute_value || "").toLowerCase();

  return (
    name.includes(searchTerm.toLowerCase()) ||
    sku.includes(searchTerm.toLowerCase()) ||
    qrcode.includes(searchTerm.toLowerCase())
  );
});

    // .map((product) => ({
    //   type: "product",
    //   data: product,
    // }));
  // const filteredOrders = orders
  //   .filter((order) => {
  //     const orderId = (order?.increment_id || "").toLowerCase();
  //     const firstName = (order?.shipping_address?.firstname || "").toLowerCase();
  //     const lastName = (order?.shipping_address?.lastname || "").toLowerCase();
  //     const city = (order?.shipping_address?.city || "").toLowerCase();
  //     const grandTotal = (order?.order_grandtotal || "").toString().toLowerCase();

  //     return (
  //       orderId.includes(searchTerm) ||
  //       firstName.includes(searchTerm) ||
  //       lastName.includes(searchTerm) ||
  //       city.includes(searchTerm) ||
  //       grandTotal.includes(searchTerm)
  //     );
  //   })

    // .map((order) => ({
    //   type: "order",
    //   data: order,
    // }));

  return filteredProducts;
};


export const getFilteredOrders = (orders, searchTerm) => {
  return orders.filter((order) => {
    const orderId = (order?.increment_id || "").toLowerCase();
    const firstName = (order?.shipping_address?.firstname || "").toLowerCase();
    const lastName = (order?.shipping_address?.lastname || "").toLowerCase();
    const city = (order?.shipping_address?.city || "").toLowerCase();
    const grandTotal = (order?.order_grandtotal || "").toString().toLowerCase();
    const customer_email = (order?.customer_email || "").toString().toLowerCase();

    return (
      orderId.includes(searchTerm) ||
      firstName.includes(searchTerm) ||
      lastName.includes(searchTerm) ||
      city.includes(searchTerm) ||
      grandTotal.includes(searchTerm) ||
      customer_email.includes(searchTerm)
    );
  });
};

export const getFilteredEmployees = (employees = [], term = "") => {
  return employees.filter((emp) =>
    ["firstname", "lastname", "email", "username"].some((key) =>
      emp[key]?.toLowerCase().includes(term)
    )
  );
};
