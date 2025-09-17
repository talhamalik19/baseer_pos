const salesByCountriesQuery =`
{
   salesPercentageByCountries {
       success
       message
       data {
           country_id
           order_count
           order_percentage
           country_name
       }
   }
}
`;
export default salesByCountriesQuery;