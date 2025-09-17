const getOrdersByKeyQuery = (key, pageSize = 10, page = 1) =>
  `{
  getOrdersByKey(
    orderKey: "${key}"
    ) {
      success
      message
      total_count
      data {
        entity_id
        created_at
        customer_email
        order_grandtotal
        increment_id
        customer_firstname
        customer_lastname
        order_status
        shipping_address {
          firstname
          lastname
          city
          region
          postcode
          country_id
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
          image_url
          item_price
          item_qty_ordered
          category {
            id
            name
          }
          super_attribute
        }
      }
    }
  }`;

export default getOrdersByKeyQuery;