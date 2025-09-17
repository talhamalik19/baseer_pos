export default function addToCart(sku, cartId, options){
    return `
      mutation {
        addProductsToCart(
          cartId: "${cartId}"
          cartItems: [{ 
            sku: "${sku}", 
            quantity: 1,  
            selected_options: ${JSON.stringify(options)}
          }]
        ) {
          cart {
            items {
              id
              product {
                name
                sku
              }
              quantity
            }
          }
        }
      }
    `;
  };
  