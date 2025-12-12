const customerQuery = (search, pageSize, page) => `
query {
 getCustomers (searchKeyWord:"${search}", pageSize: ${pageSize} currentPage: ${page}) {
   success
   message
   total_customers
   data {
       firstname
       lastname
       email
       customer_id
       created_at
       orders {
             entity_id
       created_at
       customer_email
       order_grandtotal
       increment_id
       
        customer_firstname
       customer_lastname
       shipping_address {
           firstname
           lastname
           city
           region
           postcode
           country_id
           telephone
       }
              billing_address{
        telephone
       }
       invoice {
           invoice_id
       }
       payment {
           payment_id
           payment_method
           payment_method_title
       }
       items {
           item_id
           product_name
           product_id
           product_sku
        item_price
           item_qty_ordered
           category {
               id
               name
           }
       }
       }
   }
}
}
`;
export default customerQuery;