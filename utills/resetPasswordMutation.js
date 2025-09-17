export default function resetPasswordMutation(username, password, newPassword){
    return `
      mutation {
   updatePassword(username: "${username}", currentPassword: "${password}", newPassword: "${newPassword}") {
       success
       message
   }
}

    `;
  };
  