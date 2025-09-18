"use client";
import styles from "@/components/blocks/Employees/employeeModal.module.scss";
import { useEffect } from "react";
export default function SimpleAlertModal({
  isOpen,
  onClose,
  title = "Alert",
  message,
  consent,
  qrcode
}) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow || "auto";
    }
    return () => {
      document.body.style.overflow = originalOverflow || "auto";
    };
  }, [isOpen]);
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.tabContent} style={{ display: "block" }}>
            <div style={{ padding: "20px 0", textAlign: "center" }} >
              {consent == undefined || !consent || consent == null ? (
                message
              ) : (
               <img src={qrcode} alt="qr code" />
              )}
            </div>

            <div className={styles.formFooter}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={onClose}
                style={{ width: "100%" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
