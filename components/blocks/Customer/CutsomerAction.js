import Link from 'next/link';
import React from 'react'

export default function CutsomerAction({customer, jwt, responseMessage, styles, serverLanguage}) {
      
  return (
    <td>
    <Link href={`/order?customer_email=${customer?.email}`} className={styles.viewDetailBtn}>
      {serverLanguage?.view_detail ?? "View Detail"}
    </Link>
    </td>
  )
}
