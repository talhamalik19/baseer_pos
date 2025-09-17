const searchQuery = (search) => `
   query {
          products(${search}) {
            items {
              id
              name
              sku
              url_key
              meta_title
              meta_keyword
              meta_description
              image {
                url
                label
              }
              thumbnail {
                url
                label
              }
            }
          }
        }
`;

export default searchQuery;
