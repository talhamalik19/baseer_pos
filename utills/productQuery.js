const productQuery = (id, sort) => `
  query {
    products(filter: { category_id: { eq: "${id}" } } pageSize: 1000 ${sort}) {
     total_count
      items {
      id
        uid
        name
        sku
         fbr_tax_applied
    apply_tax_after_discount
    catalog_prices_including_tax
    discount_including_tax
    is_pos_discount_allowed
        stock_status
          tax_percent
      pos_discount_percent
      apply_discount_on
      custom_price
      pos_stock
            custom_attributes {
            attribute_code
            attribute_label
            attribute_value
     }
          categories{
            name
        }
        __typename
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
          }
        }
        price {
          regularPrice {
            amount {
              value
              currency
            }
          }
        }
        image {
          url
          label
        }
        small_image {
          url
          label
        }
        thumbnail {
          url
          label
        }
        special_price
  ... on ConfigurableProduct {
  configurable_options {
    attribute_id
    attribute_code
    label
    values {
      uid
      value_index
      label
    }
  }
  variants {
    product {
      sku
    }
    attributes {
      code
      value_index
    }
  }
}

       ... on CustomizableProductInterface {
        options {
          title
          required
          sort_order
          option_id
          ... on CustomizableRadioOption {
            radio_option: value {
              option_type_id
              sku
              price
              price_type
              title
              sort_order
            }
          }
          ... on CustomizableCheckboxOption {
            checkbox_option: value {
              option_type_id
              sku
              price
              price_type
              title
              sort_order
            }
          }
        }
      }
        ... on DownloadableProduct {
          links_title
          links_purchased_separately
          downloadable_product_links {
            sample_url
            sort_order
            title
            uid
            price
          }
          downloadable_product_samples {
            title
            sort_order
            sample_url
          }
        }
      }
    }
  }
`;

export default productQuery;
