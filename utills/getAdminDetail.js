 const adminDetail = `
  query {
    getAdminDetail {
        success
        message
        data {
            id
            username
            firstname
            lastname
            email
            stores {
                store_id
                store_name
                store_code
            }
        }
    }
 }`;
export default adminDetail;