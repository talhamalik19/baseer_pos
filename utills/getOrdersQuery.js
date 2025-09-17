const getOrdersQuery = (searchKeyword, pageSize = 10, page = 1) =>
  `{
    getOrders(
      orderFilter: {
        email: "${searchKeyword.email}"
        phone: "${searchKeyword.phone}"
        orderNumber: "${searchKeyword.orderNumber}"
        billName: "${searchKeyword.billName}"
        status: "${searchKeyword.status}"
        isPosOrder: ${searchKeyword.isPosOrder === null ? null : searchKeyword.isPosOrder}
        isWebOrder: ${searchKeyword.isWebOrder === null ? null : searchKeyword.isWebOrder}
        isMobOrder: ${searchKeyword.isMobOrder === null ? null : searchKeyword.isMobOrder}
        posCode: "${searchKeyword.posCode}"
        dateFrom: "${searchKeyword.dateFrom}"
        dateTo: "${searchKeyword.dateTo}"
      },
      pageSize: ${pageSize},
      currentPage: ${page}
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

export default getOrdersQuery;