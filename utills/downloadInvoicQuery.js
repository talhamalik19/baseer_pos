export default function downloadInvoice(id){
    return `
     query{
    downloadInvoicePdf(invoice_id: ${id}) {
    success
    message
    filename
    url
  }
}

    `;
  };
  