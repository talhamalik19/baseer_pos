const handlePasswordChangeQuery = (email, password, otp) => `
mutation {
    resetPasswordWithOtp(email: "${email}", newPassword: "${password}", otp: "${otp}") {
        success
        message
    }
}
 

`;

export default handlePasswordChangeQuery;
