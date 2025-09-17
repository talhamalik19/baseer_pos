const graphQuery = (duration) => `
{
getOrdersGraph (graphDurationType:${duration}) {
   success
   message
   data {
       graphPoints {
           X
           Y
       }
       revenue_details {
           revenue
           tax
           shipping
           quantity
       }
   
   }
 }
}
`;
export default graphQuery;