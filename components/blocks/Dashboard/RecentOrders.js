import Link from "next/link";
import styles from "./dashboard.module.scss";

const block = {
    title: 'Recent Orders',
    showOrdersCta: 'Show All Orders',
}

const tableHead = {
    id: 'ID',
    name: "Customer Name",
    product: "Product",
    amount: "Amount",
    category: "Category",
    status: "Status"
}

export default function RecentOrders({showCta, items, serverLanguage}) {
  return (
    <div className="section_padding">
    <div className={styles.orders}>
      <div className={styles.order_head}>
        <div className={styles.title}>{serverLanguage?.recent_orders ?? block?.title}</div>
        {showCta && <Link href={'/order'} className={styles.orders_link}>{serverLanguage?.show_all_orders ?? block?.showOrdersCta}</Link>}
      </div>
      <div className={styles.table_block}>
      <table className={`${styles.table} ${styles.recent_orders}`}>
        <thead>
          <tr>
            <th>{serverLanguage?.id ?? tableHead?.id}</th>
            <th>{serverLanguage?.customer_name ?? tableHead?.name}</th>
            <th>{serverLanguage?.product_name ?? tableHead?.product}</th>
            <th>{serverLanguage?.category ?? tableHead?.category}</th>
            <th>{serverLanguage?.amount ?? tableHead?.amount}</th>
            <th className={styles.status_td}>{serverLanguage?.status ?? tableHead?.status}</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((order) => (
            <tr key={order?.order_id}>
              <td>{order?.order_id}</td>
              {/* <td className={styles.name}>{`${order?.customer_firstname} ${order?.customer_lastname}`}</td> */}
              <td className={styles.name}>Test</td>
              <td>{order?.product_name}</td>
              <td>{order?.category.map((item)=>item?.name).join(",")}</td>
              <td className={styles.amount}>${order.order_grandtotal}</td>
              <td className={styles.status_td}>
                <span className={`${styles.status} ${order.order_status == "complete" ? styles.complete : order?.order_status == "pending" ? styles.pending : styles.cancelled}`}>
                  {order.order_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
    </div>
  );
}
