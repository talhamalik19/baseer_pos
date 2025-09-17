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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83zM3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z" fill='white'/>
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill='white'/>
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