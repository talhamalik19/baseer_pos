const salesStats = (duration) => `{
 salesReport (reportDuration: ${duration})  {
   success
   message
   data {
     orders {
       total_orders
       order_percentage
       status
     }
     sales {
       total_earnings
       earning_percentage
       status
     }
     customers {
       total_customers
       customers_percentage
       status
     }
   
   }
 }
}
`;

export default salesStats;
