export default function getCartQuery(cartId){
    return `
     query{
  cart(cart_id: "${cartId}") {
    email
items {
  id
  product {
    name
    sku
    url_key
    image {
      url
      label
    }
      thumbnail {
      url
      label
    }
    __typename
  }
  quantity
  prices {
    total_item_discount {
      value
    }
    price {
      value
      currency
    }
    discounts {
      label
      amount {
        value
      }
    }
  }
  ... on DownloadableCartItem {
    links {
      id
      title
      price
    }
    samples {
      title
      sample_url
    }
  }        
  ... on DownloadableCartItem {
    customizable_options {
      label
      id
      type
      values {
        value
        label
        price {
          value
          units
        }
      }
    }
    links {
      title
      sample_url
      price
    }
  }
}
    prices {
      discounts {
        amount {
          value
        }
        applied_to
        label
      }
      grand_total {
        value
      }
        subtotal_excluding_tax {
        value
      }
    }
  }
}

    `;
  };
  