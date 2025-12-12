"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Select from 'react-select';
import styles from "./employeeModal.module.scss";
import { addEmployeeAction } from "@/lib/Magento/actions";

// Define mandatory permissions that cannot be changed
const MANDATORY_PERMISSIONS = ["sales_process", "orders_view", "manage_pos", "catalog_manage"];

// Permission groups configuration
const PERMISSION_GROUPS = [
  {
    id: "dashboard",
    label: "Dashboard",
    permissions: [{ id: "dashboard_view", label: "View Dashboard" }],
  },
  {
    id: "settings",
    label: "Settings",
    permissions: [
      { id: "employees_password_update", label: "Account" },
      { id: "settings_customization", label: "POS Configuration" },
      { id: "manage_pos", label: "POS Information" },
    ],
  },
  {
    id: "employees",
    label: "Employees",
    permissions: [
      { id: "employees_view", label: "View Employee" },
      { id: "add_employees", label: "Add New Employee" },
      { id: "employees_password_update", label: "Password Update" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    permissions: [{ id: "catalog_manage", label: "Manage Products" }],
  },
  {
    id: "manage_products",
    label: "Manage Products",
    permissions: [
      { id: "update_product", label: "Update Product" },
      { id: "update_name", label: "Update Product Name" },
      { id: "update_image", label: "Update Product Image" },
      { id: "update_price", label: "Update Product Price" },
      { id: "update_special_price", label: "Update Product Special Price" },
      { id: "update_stock", label: "Update Product Stock" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    permissions: [{ id: "sales_process", label: "Process Sales" }, { id: "sales_discount", label: "Apply Disocunt On Product" }],
  },
  {
    id: "orders",
    label: "Orders",
    permissions: [
      { id: "orders_view", label: "View Orders" },
      { id: "orders_suspend", label: "Suspend Orders" },
      { id: "orders_refund", label: "Refund Orders" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    permissions: [{ id: "customers_manage", label: "Manage Customers" }],
  },
  {
    id: "Suspend",
    label: "Suspend",
    permissions: [{ id: "suspend_orders", label: "Suspend" }],
  },
  {
    id: "reports",
    label: "Report",
    permissions: [{ id: "reports_view", label: "View Reports" },
    { id: "reports_other_staff", label: "View All Staff Reports" },
    ],
  },
];

const INITIAL_FIELD_ERRORS = {
  firstname: "",
  lastname: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  location: "",
  pos_codes: "",
};

export default function EmployeeModal({
  isOpen,
  onClose,
  employee,
  mode = "create",
  jwt,
  user,
  warehouseCodes
}) {
  const [activeTab, setActiveTab] = useState(mode === "edit" ? "permissions" : "loginInfo");
  const [isLoginInfoSubmitted, setIsLoginInfoSubmitted] = useState(mode === "edit");
  const [employeeId, setEmployeeId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [dataChanged, setDataChanged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(INITIAL_FIELD_ERRORS);
  const [generalError, setGeneralError] = useState("");

  // Memoized POS options
  const posOptions = useMemo(() => 
    warehouseCodes.map(code => ({ value: code, label: code })), 
    [warehouseCodes]
  );

  // Get all permission IDs
  const allPermissionIds = useMemo(() => 
    PERMISSION_GROUPS.flatMap(group => group.permissions.map(p => p.id)),
    []
  );

  // Initial form data factory
  const getInitialFormData = useCallback(() => ({
    firstname: "",
    lastname: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    location: "",
    role: "employee",
    permissions: [...MANDATORY_PERMISSIONS, ...allPermissionIds.filter(id => !MANDATORY_PERMISSIONS.includes(id))],
    pos_codes: [],
  }), [allPermissionIds]);

  const [formData, setFormData] = useState(getInitialFormData);

  // Initialize form when employee data changes
  useEffect(() => {
    if (employee) {
      setFormData({
        firstname: employee.firstname || "",
        lastname: employee.lastname || "",
        email: employee.email || "",
        username: employee.username || "",
        password: "",
        confirmPassword: "",
        pos_codes: employee.pos_codes || [],
        location: employee.location || "",
        role: employee.role || "employee",
        permissions: [
          ...new Set([
            ...(Array.isArray(employee.permissions) ? employee.permissions : []),
            ...allPermissionIds.filter(id => !MANDATORY_PERMISSIONS.includes(id)),
            ...MANDATORY_PERMISSIONS
          ])
        ],
      });
      setEmployeeId(employee.id);

      if (mode === "edit") {
        setIsLoginInfoSubmitted(true);
        setActiveTab("permissions");
      }
    } else {
      setFormData(getInitialFormData());
      setEmployeeId(null);
      setIsLoginInfoSubmitted(false);
      setActiveTab("loginInfo");
    }
  }, [employee, mode, allPermissionIds, getInitialFormData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setEmployeeId(null);
    setIsLoginInfoSubmitted(false);
    setActiveTab("loginInfo");
    setFieldErrors(INITIAL_FIELD_ERRORS);
    setGeneralError("");
    setSubmitError(null);
    setIsSubmitting(false);
    setDataChanged(false);
  }, [getInitialFormData]);

  // Check if group has only mandatory children
  const isGroupAllMandatory = useCallback((groupId) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;
    return group.permissions.every(p => MANDATORY_PERMISSIONS.includes(p.id));
  }, []);

  // Check if all non-mandatory children are selected
  const allChildrenSelected = useCallback((groupId) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;
    
    const nonMandatory = group.permissions.filter(p => !MANDATORY_PERMISSIONS.includes(p.id));
    
    // If all children are mandatory, return true
    if (nonMandatory.length === 0) return true;
    
    return nonMandatory.every(p => formData.permissions.includes(p.id));
  }, [formData.permissions]);

  // Check if some (but not all) non-mandatory children are selected
  const someChildrenSelected = useCallback((groupId) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;
    
    const nonMandatory = group.permissions.filter(p => !MANDATORY_PERMISSIONS.includes(p.id));
    
    // If all children are mandatory, return false (no indeterminate state)
    if (nonMandatory.length === 0) return false;
    
    const selectedCount = nonMandatory.filter(p => formData.permissions.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < nonMandatory.length;
  }, [formData.permissions]);

  // Handle parent checkbox change
  const handleParentChange = useCallback((groupId) => {
    // Don't allow changes if all children are mandatory
    if (isGroupAllMandatory(groupId)) return;

    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    const nonMandatoryChildIds = group.permissions
      .map(p => p.id)
      .filter(id => !MANDATORY_PERMISSIONS.includes(id));

    setFormData((prev) => {
      const allCurrentlyChecked = nonMandatoryChildIds.every(id => prev.permissions.includes(id));

      return {
        ...prev,
        permissions: allCurrentlyChecked
          ? [...prev.permissions.filter(id => !nonMandatoryChildIds.includes(id)), ...MANDATORY_PERMISSIONS]
          : [...new Set([...prev.permissions, ...nonMandatoryChildIds])],
      };
    });
  }, [isGroupAllMandatory]);

  // Handle child checkbox change
  const handleChildChange = useCallback((permissionId) => {
    if (MANDATORY_PERMISSIONS.includes(permissionId)) return;

    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  }, []);

  // Validate email
  const validateEmail = useCallback((email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.toLowerCase());
  }, []);

  // Validate login info
  const validateLoginInfo = useCallback(() => {
    const newErrors = { ...INITIAL_FIELD_ERRORS };
    let isValid = true;

    if (!formData.firstname.trim()) {
      newErrors.firstname = "First Name is required";
      isValid = false;
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = "Last Name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }

    if (mode === "create") {
      if (!formData.password.trim()) {
        newErrors.password = "Password is required";
        isValid = false;
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
        isValid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
      isValid = false;
    }

    if (formData.pos_codes.length === 0) {
      newErrors.pos_codes = "At least one POS Code is required";
      isValid = false;
    }

    setFieldErrors(newErrors);
    return isValid;
  }, [formData, mode, validateEmail]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { id, value } = e.target;

    if (fieldErrors[id]) {
      setFieldErrors((prev) => ({ ...prev, [id]: "" }));
    }
    if (generalError) setGeneralError("");
    if (submitError) setSubmitError(null);

    setFormData((prev) => ({ ...prev, [id]: value }));
  }, [fieldErrors, generalError, submitError]);

  // Handle POS code change
  const handlePosCodeChange = useCallback((selectedOptions) => {
    if (fieldErrors.pos_codes) {
      setFieldErrors(prev => ({ ...prev, pos_codes: "" }));
    }
    
    setFormData(prev => ({
      ...prev,
      pos_codes: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  }, [fieldErrors.pos_codes]);

  // Handle login info submit
  const handleLoginInfoSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateLoginInfo()) return;

    if (mode === "edit") {
      setIsLoginInfoSubmitted(true);
      setActiveTab("permissions");
      return;
    }
    
    setEmployeeId(employee?.id);
    setIsLoginInfoSubmitted(true);
    setActiveTab("permissions");
  }, [validateLoginInfo, mode, employee?.id]);

  // Handle permissions submit
  const handlePermissionsSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    if (!formData.pos_codes || formData.pos_codes.length === 0) {
      setFieldErrors(prev => ({ ...prev, pos_codes: "At least one POS Code is required" }));
      setIsSubmitting(false);
      return;
    }

    try {
      // Create ACL object
      const aclData = {};
      allPermissionIds.forEach((permission) => {
        aclData[permission] = formData.permissions.includes(permission);
      });

      // Create employee data
      const employeeData = {
        id: mode === "edit" ? employeeId : '',
        username: formData.username,
        email: formData.email,
        firstname: formData.firstname,
        lastname: formData.lastname,
        password: formData.password || "",
        pos_code: formData.pos_codes,
        storeIds: user?.data?.stores?.[0]?.store_id || 1,
        location: formData.location,
        role: formData.role,
        acl: aclData
      };

      // Remove undefined fields
      Object.keys(employeeData).forEach(key => 
        employeeData[key] === undefined && delete employeeData[key]
      );

      const result = await addEmployeeAction(employeeData);
      
      if (result && (result[0] === "success" || result[0] === true)) {
        setDataChanged(true);
        onClose(e, true);
        resetForm();
      } else if(result[0] === "failure") {
        throw new Error(result[1]?.response || "Failed to save employee");
      }
    } catch (error) {
      console.error("Error submitting employee data:", error);
      setSubmitError(error.message || "Failed to save employee data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, employeeId, allPermissionIds, user, onClose, resetForm]);

  // Handle tab click
  const handleTabClick = useCallback((tab) => {
    if (tab === "permissions" && !isLoginInfoSubmitted) return;
    setActiveTab(tab);
  }, [isLoginInfoSubmitted]);

  // Handle close
  const handleClose = useCallback((e) => {
    onClose(e, dataChanged);
  }, [onClose, dataChanged]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{mode === "edit" ? "Update" : "Create"} Employee</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            &times;
          </button>
          <div className={styles.tabs}>
            {mode === "create" && (
              <button
                className={`${styles.tab} ${activeTab === "loginInfo" ? styles.active : ""}`}
                onClick={() => handleTabClick("loginInfo")}
              >
                Login & Info
              </button>
            )}
            <button
              className={`${styles.tab} ${
                activeTab === "permissions" || mode === "edit" ? styles.active : ""
              } ${!isLoginInfoSubmitted ? styles.disabled : ""}`}
              onClick={() => handleTabClick("permissions")}
              disabled={!isLoginInfoSubmitted}
            >
              Permission
            </button>
          </div>
        </div>
        
        <div className={styles.modalBody}>
          {/* Login Info Tab */}
          {mode === "create" && (
            <div className={`${styles.tabContent} ${activeTab === "loginInfo" ? styles.active : ""}`}>
              <form onSubmit={handleLoginInfoSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.required} htmlFor="firstname">First Name</label>
                    <input
                      type="text"
                      id="firstname"
                      className={`${styles.formControl} ${fieldErrors.firstname ? styles.error : ""}`}
                      value={formData.firstname}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.firstname && <div className={styles.fieldError}>{fieldErrors.firstname}</div>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.required} htmlFor="lastname">Last Name</label>
                    <input
                      type="text"
                      id="lastname"
                      className={`${styles.formControl} ${fieldErrors.lastname ? styles.error : ""}`}
                      value={formData.lastname}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.lastname && <div className={styles.fieldError}>{fieldErrors.lastname}</div>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.required} htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className={`${styles.formControl} ${fieldErrors.email ? styles.error : ""}`}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {fieldErrors.email && <div className={styles.fieldError}>{fieldErrors.email}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.required} htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    className={`${styles.formControl} ${fieldErrors.username ? styles.error : ""}`}
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                  {fieldErrors.username && <div className={styles.fieldError}>{fieldErrors.username}</div>}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.required} htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      className={`${styles.formControl} ${fieldErrors.password ? styles.error : ""}`}
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.password && <div className={styles.fieldError}>{fieldErrors.password}</div>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.required} htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className={`${styles.formControl} ${fieldErrors.confirmPassword ? styles.error : ""}`}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.confirmPassword && <div className={styles.fieldError}>{fieldErrors.confirmPassword}</div>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.required}>POS Codes</label>
                  <Select
                    isMulti
                    options={posOptions}
                    value={posOptions.filter(option => formData.pos_codes.includes(option.value))}
                    onChange={handlePosCodeChange}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Select POS codes..."
                  />
                  {fieldErrors.pos_codes && <div className={styles.fieldError}>{fieldErrors.pos_codes}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.required} htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    className={`${styles.formControl} ${fieldErrors.location ? styles.error : ""}`}
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                  {fieldErrors.location && <div className={styles.fieldError}>{fieldErrors.location}</div>}
                </div>

                <div className={styles.formFooter}>
                  <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Continue to Permissions'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Permissions Tab */}
          <div className={`${styles.tabContent} ${activeTab === "permissions" || mode === "edit" ? styles.active : ""}`}>
            <form onSubmit={handlePermissionsSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.required}>POS Codes</label>
                <Select
                  isMulti
                  options={posOptions}
                  value={posOptions.filter(option => formData.pos_codes.includes(option.value))}
                  onChange={handlePosCodeChange}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select POS codes..."
                  required
                  styles={{height: "55px", backgroundColor: "#f6f6f6"}}
                />
                {fieldErrors.pos_codes && <div className={styles.fieldError}>{fieldErrors.pos_codes}</div>}
              </div>

              <div className={styles.permissionsSection}>
                <h4>Module Permissions</h4>
                <p>Check the boxes below to grant access to modules</p>

                {PERMISSION_GROUPS.map((group) => {
                  const isAllMandatory = isGroupAllMandatory(group.id);
                  
                  return (
                    <div key={group.id} className={styles.permissionCategory}>
                    <div className={styles.parentPermission}>
                      <label className={styles.checkboxWrapper}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          id={`group-${group.id}`}
                          checked={allChildrenSelected(group.id)}
                          onChange={() => handleParentChange(group.id)}
                          disabled={isAllMandatory}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = someChildrenSelected(group.id);
                            }
                          }}
                        />
                        <span className={styles.customCheck}></span>
                  
                        {group.label}
                        {isAllMandatory && " (All Required)"}
                      </label>
                    </div>
                  
                    <div className={styles.childPermissions}>
                      {group.permissions.map((permission) => (
                        <label key={permission.id} className={styles.checkboxWrapper}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            id={permission.id}
                            value={permission.id}
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => handleChildChange(permission.id)}
                            disabled={MANDATORY_PERMISSIONS.includes(permission.id)}
                          />
                          <span className={styles.customCheck}></span>
                  
                          {permission.label}
                          {MANDATORY_PERMISSIONS.includes(permission.id) && " (Required)"}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  );
                })}
              </div>

              {generalError && <div className={styles.generalError}>{generalError}</div>}
              {submitError && <div className={styles.generalError}>{submitError}</div>}

              <div className={styles.formFooter}>
                {mode === "create" && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setActiveTab("loginInfo")}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                )}
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : mode === "edit" ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}