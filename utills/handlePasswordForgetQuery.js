const handlePasswordForgetQuery = (email) => `
mutation {
   initiatePasswordReset(email: "${email}") {
       success
       message
   }
}
 

`;

export default handlePasswordForgetQuery;
