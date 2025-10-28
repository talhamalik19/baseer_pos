import Link from "next/link";
import styles from "./dashboard.module.scss";

const block = {
  title: "Recent Orders",
  showOrdersCta: "Show All Orders",
};

const tableHead = {
  id: "ID",
  name: "Customer Name",
  product: "Product",
  amount: "Amount",
  category: "Category",
  status: "Status",
};

const order={
  customer_firstname: "POS",
  customer_lastname: "Customer"
}

// console.log(order?.customer_firstname ? order?.customer_firstname?.charAt(0) : "p", order?.customer_lastname ? order?.customer_lastname?.charAt(0) : "C" )

export default function RecentOrders({ showCta, items, serverLanguage }) {
  return (
    <div className="section_padding">
      <div className={styles.orders}>
        <div className={styles.order_head}>
          <div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.25 5.25H12.75V12.75"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M5.25 12.75L12.75 5.25"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div>
              <p className={styles.title}>
                {serverLanguage?.recent_orders ?? block?.title}
              </p>
              <p className={styles.summary}>Latest customer transactions</p>
            </div>
          </div>
          {showCta && (
            <Link href={"/order"} className={styles.orders_link}>
              {serverLanguage?.show_all_orders ?? block?.showOrdersCta}
            </Link>
          )}
        </div>
  {items && items.length > 0 && (
  <div className={styles.table_block}>
    <table className={`${styles.table} ${styles.recent_orders}`}>
      <thead>
        <tr>
          <th>{serverLanguage?.id ?? tableHead?.id}</th>
          <th>{serverLanguage?.customer_name ?? tableHead?.name}</th>
          <th>{serverLanguage?.product_name ?? tableHead?.product}</th>
          <th>{serverLanguage?.category ?? tableHead?.category}</th>
          <th>{serverLanguage?.amount ?? tableHead?.amount}</th>
          <th className={styles.status_td}>
            {serverLanguage?.status ?? tableHead?.status}
          </th>
        </tr>
      </thead>
      <tbody>
    {items?.map((order) => (
  <tr
    key={order?.order_id}
    className={
      order?.order_status === "complete"
        ? styles.complete
        : order?.order_status === "pending"
        ? styles.pending
        : styles.cancelled
    }
  >
    <td
      className={`${styles.id} ${
        order?.order_status === "complete"
          ? styles.complete
          : order?.order_status === "pending"
          ? styles.pending
          : styles.cancel
      }`}
    >
      {order?.increment_id}
    </td>

    <td className={styles.name}> <div><div><span>{order?.customer_firstname ? order?.customer_firstname?.charAt(0) : "P"}</span><span>{order?.customer_lastname ? order?.customer_lastname?.charAt(0) : "C"}</span></div></div>
      {`${order?.customer_firstname ?? "POS"} ${
        order?.customer_lastname ?? "Customer"
      }`}
    </td>

    <td className={styles.prod_name}>
      <span>
        {Array.from(
          new Set(order?.items?.map((item) => item?.product_name))
        ).join(", ")}
      </span>
    </td>

    <td className={styles.cat_name}>
      <span>
        {Array.from(
          new Set(
            order?.items?.flatMap(
              (item) => item?.category?.map((cat) => cat?.name) || []
            )
          )
        ).join(", ")}
      </span>
    </td>

    <td className={styles.amount}>${order?.order_grandtotal}</td>

    <td className={styles.status_td}>
      <span
        className={`${styles.status} ${
          order?.order_status === "complete"
            ? styles.complete
            : order?.order_status === "pending"
            ? styles.pending
            : styles.cancelled
        }`}
      >
        {order?.order_status}
      </span>
    </td>
  </tr>
))}

      </tbody>
    </table>
  </div>
)}

      </div>
    </div>
  );
}
