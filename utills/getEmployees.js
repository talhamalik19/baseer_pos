const employeesQuery = (code) => `
query{
   getStoreEmployees(searchKeyWord:"", warehouseCode: ${code}) {
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
               acl{
               key
               value}
        pos_codes
       }
   }
}`;
         
         export default employeesQuery;
         