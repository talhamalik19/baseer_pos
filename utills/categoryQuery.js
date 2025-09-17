const categoryQuery = () => `
  query {
  categoryList{
    children_count
    children {
      id
      uid
      level
      name
      path
      url_path
      url_key
      children {
        uid
        id
        level
        name
        path
        url_path
        url_key
      }
    }
  }
}`;
export default categoryQuery;