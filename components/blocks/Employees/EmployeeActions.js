"use client";
import React, { useEffect, useState, useCallback } from 'react';
import styles from './employeeDetail.module.scss';
import { deleteEmployeeAction, resetPasswordAction } from '@/lib/Magento/actions';

export function EmployeeActions({ jwt, employee, onEdit, onDataChange, permissions }) {
  const [responseMessage, setResponseMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Clear message after timeout
  const clearMessage = useCallback(() => {
    setTimeout(() => {
      setResponseMessage("");
      setMessageType("");
    }, 5000);
  }, []);

  const handlePasswordUpdate = useCallback(async (employee, e) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const form = e.target;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;
    const currentPassword = form.currentPassword.value;

    if (newPassword !== confirmPassword) {
      setResponseMessage("Passwords do not match");
      setMessageType("error");
      clearMessage();
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate API call - replace with your actual resetPasswordAction
      const res = await resetPasswordAction(
        employee.username,
        currentPassword,
        newPassword,
      );
      
      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
            
      form.reset();
      setShowUpdateModal(false);
      setResponseMessage(`Password for ${employee.username} updated successfully`);
      setMessageType("success");
      
      // Notify parent component that data changed
      if (onDataChange) {
        onDataChange();
      }
      
      clearMessage();
    } catch (error) {
      setResponseMessage("Failed to update password");
      setMessageType("error");
      clearMessage();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, clearMessage, onDataChange]);

  const handleDelete = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Simulate API call - replace with your actual deleteEmployeeAction
      const res = await deleteEmployeeAction(employee.username);
      if(res?.data){
      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowDeleteModal(false);
      setResponseMessage(`${employee.username} deleted successfully`);
      setMessageType("success");
      }
      
      // Notify parent component that data changed
      if (onDataChange) {
        onDataChange();
      }
      
      clearMessage();
    } catch (error) {
      setResponseMessage("Failed to delete employee");
      setMessageType("error");
      clearMessage();
    } finally {
      setIsProcessing(false);
    }
  }, [employee.username, employee.id, isProcessing, onDataChange, clearMessage]);

  const openUpdateModal = useCallback(() => {
    setShowUpdateModal(true);
  }, []);

  const closeUpdateModal = useCallback(() => {
    setShowUpdateModal(false);
  }, []);

  const openDeleteModal = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Check permissions
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("role") !== "admin";
  const canUpdatePassword = permissions?.employees_password_update;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  return (
    <>
      {responseMessage && (
        <div className={`${styles.messageBox} ${styles[messageType]}`}>
          {responseMessage}
        </div>
      )}
      
      <td className={styles.actions}>
        {canEdit && (
          <button 
            className={styles.updateBtn}
            onClick={onEdit}
            disabled={isProcessing}
          >
     <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_635_3370)">
<path d="M14.1161 4.54135C14.4686 4.18897 14.6666 3.711 14.6667 3.21259C14.6668 2.71418 14.4688 2.23616 14.1165 1.88369C13.7641 1.53121 13.2861 1.33316 12.7877 1.3331C12.2893 1.33304 11.8113 1.53097 11.4588 1.88335L2.56145 10.7827C2.40667 10.937 2.29219 11.127 2.22812 11.336L1.34745 14.2374C1.33022 14.295 1.32892 14.3563 1.34369 14.4146C1.35845 14.4729 1.38873 14.5262 1.43132 14.5687C1.4739 14.6112 1.5272 14.6414 1.58556 14.6561C1.64392 14.6707 1.70516 14.6693 1.76279 14.652L4.66479 13.772C4.87357 13.7085 5.06357 13.5947 5.21812 13.4407L14.1161 4.54135Z" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_635_3370">
<rect width="16" height="16" fill="white"/>
</clipPath>
</defs>
</svg>


          </button>
        )}

        {canUpdatePassword && (
          <button 
            className={styles.updateBtn}
            onClick={openUpdateModal}
            disabled={isProcessing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 1C8.14 1 5 4.14 5 8c0 3.47 3.18 6.32 6.5 6.89V19h-1v2h1v1h2v-1h1v-2h-1v-4.11c3.32-.57 6.5-3.42 6.5-6.89C19 4.14 15.86 1 12 1zm0 2a5 5 0 015 5c0 2.76-2.24 5-5 5s-5-2.24-5-5a5 5 0 015-5z" fill='white'/>
            </svg>
          </button>
        )}

        {canDelete && (
          <button
            className={styles.deleteBtn}
            onClick={openDeleteModal}
            disabled={isProcessing}
          >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.6665 7.33334V11.3333" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.3335 7.33334V11.3333" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.6668 4V13.3333C12.6668 13.687 12.5264 14.0261 12.2763 14.2761C12.0263 14.5262 11.6871 14.6667 11.3335 14.6667H4.66683C4.31321 14.6667 3.97407 14.5262 3.72402 14.2761C3.47397 14.0261 3.3335 13.687 3.3335 13.3333V4" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2 4H14" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.3335 4.00001V2.66668C5.3335 2.31305 5.47397 1.97392 5.72402 1.72387C5.97407 1.47382 6.31321 1.33334 6.66683 1.33334H9.3335C9.68712 1.33334 10.0263 1.47382 10.2763 1.72387C10.5264 1.97392 10.6668 2.31305 10.6668 2.66668V4.00001" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>


          </button>
        )}
        
        {/* Update Password Modal */}
        {showUpdateModal && (
          <div className={styles.modalOverlay} onClick={closeUpdateModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Update Password for {employee.username}</h2>
                <button 
                  className={styles.closeBtn}
                  onClick={closeUpdateModal}
                  disabled={isProcessing}
                >
                  ×
                </button>
              </div>
              <form onSubmit={(e) => handlePasswordUpdate(employee, e)} className={styles.passwordForm}>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label htmlFor={`currentPassword_${employee.id}`} className={styles.required}>Current Password</label>
                    <input 
                      type="password" 
                      id={`currentPassword_${employee.id}`} 
                      name="currentPassword"
                      className={styles.formControl}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor={`newPassword_${employee.id}`} className={styles.required}>New Password</label>
                    <input 
                      type="password" 
                      id={`newPassword_${employee.id}`} 
                      name="newPassword"
                      className={styles.formControl}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor={`confirmPassword_${employee.id}`} className={styles.required}>Confirm New Password</label>
                    <input 
                      type="password" 
                      id={`confirmPassword_${employee.id}`} 
                      name="confirmPassword"
                      className={styles.formControl}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formFooter}>
                  <button 
                    type="button" 
                    className={styles.btnSecondary}
                    onClick={closeUpdateModal}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.btnPrimary}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className={styles.modalOverlay} onClick={closeDeleteModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Confirm Deletion</h2>
                <button 
                  className={styles.closeBtn}
                  onClick={closeDeleteModal}
                  disabled={isProcessing}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>Are you sure you want to delete {employee.username}?</p>
              </div>
              <div className={styles.formFooter}>
                <button 
                  className={styles.btnSecondary}
                  onClick={closeDeleteModal}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  className={styles.deleteConfirmBtn}
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </td>
    </>
  );
}