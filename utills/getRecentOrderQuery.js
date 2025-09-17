const getRecentOrderQuery = `{
 getRecentOrderItems(pageSize: 5, currentPage: 1) {
   success
   message
   data {
     item_id
     product_name
     product_id
     order_id
     order_status
     item_price
     item_price_incl_tax
     item_row_total
     item_qty_ordered
     order_grandtotal
     order_subtotal
     image_url
     currency_code
     currency_symbol
     category {
       id
       name
     }
   }
 }
}
`;
   
   export default getRecentOrderQuery;
   