export default function deleteEmployeeMutation(username){
    return `
      mutation {
deleteAdminUser(username:"${username}") {
   success
   message
}
}

    `;
  };
  