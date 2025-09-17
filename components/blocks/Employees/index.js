"use client";
import { getEmployees } from "@/lib/Magento";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import dashboardStyles from "../Dashboard/dashboard.module.scss";
import { EmployeeActions } from "./EmployeeActions";
import Search from "@/components/shared/Search";
import { saveEmployeeToDB } from "@/lib/indexedDB";
import Pagination from "@/components/shared/Pagination";
import EmployeeModal from "./EmployeeModal";
import { getPOSData } from "@/lib/acl";

export default function EmployeeDetail({ jwt, employee, user, warehouseCodes, serverLanguage, warehouseId }) {
  const [employeeRecord, setEmployeeRecord] = useState(employee?.data || []);
  const originalEmployees = useMemo(() => employee?.data || [], [employee]);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDataChanged, setHasDataChanged] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;

  const { slicedRecords, totalPages } = useMemo(() => {
    const records = employeeRecord || [];
    const reversedRecords = [...records].reverse();
    const sliced = reversedRecords.slice(firstIndex, lastIndex);
    const pages = Math.ceil(records.length / recordsPerPage);
    
    return {
      slicedRecords: sliced,
      totalPages: pages
    };
  }, [employeeRecord, firstIndex, lastIndex, recordsPerPage]);

  const [permissions, setPermissions] = useState({});

  const fetchEmployees = useCallback(async () => {
    if (!hasDataChanged) return; 
    
    setIsLoading(true);
    try {
      const res = await getEmployees(warehouseId);
      if (res.data) {
        setEmployeeRecord(res.data);
        setHasDataChanged(false);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasDataChanged, recordsPerPage, currentPage]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    let isMounted = true;
    
    async function getPermissions() {
      try {
        const localData = await getPOSData();
        if (!isMounted) return;
        
        if (localData) {
          if (localData?.acl) {
            setPermissions(localData.acl);
          } else if (localData?.admin_acl) {
            setPermissions(localData.admin_acl);
          }
        }
      } catch (error) {
        console.error("Invalid pos_data in localStorage");
      }
    }
    
    getPermissions();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const setPageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleSearch = useCallback((results) => {
    setEmployeeRecord(results.length > 0 ? results : originalEmployees);
    setCurrentPage(1); // Reset to first page when searching
  }, [originalEmployees]);

  const handleEmployeeCreate = useCallback(() => {
    setSelectedEmployee(null);
    setEmployeeModal(true);
  }, []);

  const handleEditEmployee = useCallback((employee) => {
    setSelectedEmployee(employee);
    setEmployeeModal(true);
  }, []);

  // Optimized modal close - only triggers refresh if data actually changed
  const handleCloseModal = useCallback((e, dataChanged = false) => {
    e.preventDefault();
    setEmployeeModal(false);
    setSelectedEmployee(null);
    
    // Only set flag to refresh if data actually changed
    if (dataChanged) {
      setHasDataChanged(true);
    }
  }, []);

  // Callback for when employee data changes (from actions)
  const handleEmployeeDataChange = useCallback(() => {
    setHasDataChanged(true);
  }, []);

  // Check if user has permission to add employees
  const canAddEmployee = useMemo(() => {
    return (typeof window !== "undefined" && localStorage.getItem("role") !== "admin") ||
           (permissions && permissions.add_employees);
  }, [permissions]);

  // Check if user has permission for actions
  const canManageEmployees = useMemo(() => {
    return (typeof window !== "undefined" && localStorage.getItem("role") !== "admin") ||
           (permissions && permissions.employees_password_update);
  }, [permissions]);

  return (
    <div className="page_detail">
      <div className="search">
        <Search
          placeholder={serverLanguage?.search_employee ?? "Search Employee"}
          isEmployee={true}
          employee={originalEmployees}
          setEmployeeRecord={handleSearch}
        />
        {canAddEmployee && (
          <button
            onClick={handleEmployeeCreate}
            className={dashboardStyles.employee_button}
          >
            {serverLanguage?.add_new_employee ?? 'Add New Employee'}
          </button>
        )}
      </div>

      <div className={dashboardStyles.orders}>
        <div className={dashboardStyles.order_head}>
          <h2 className={dashboardStyles.title}>
            {serverLanguage?.employee_details ?? 'Employee Details'}
          </h2>
        </div>
        <div className={dashboardStyles.table_block}>
          {isLoading ? (
            <div className={dashboardStyles.loading}>
              {serverLanguage?.loading_employees ?? 'Loading employees...'}
            </div>
          ) : (
            <>
              <table className={dashboardStyles.table}>
                <thead>
                  <tr>
                    <th>{serverLanguage?.id ?? 'ID'}</th>
                    <th>{serverLanguage?.username ?? 'Username'}</th>
                    <th>{serverLanguage?.first_name ?? 'First Name'}</th>
                    <th>{serverLanguage?.last_name ?? 'Last Name'}</th>
                    <th>{serverLanguage?.email ?? 'Email'}</th>
                    <th>{serverLanguage?.role ?? 'Role'}</th>
                    {canManageEmployees && (
                      <th>{serverLanguage?.actions ?? 'Actions'}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {slicedRecords.length > 0 ? (
                    slicedRecords.map((emp) => (
                      <tr key={emp.id}>
                        <td>{emp.id}</td>
                        <td className={dashboardStyles.name}>{emp.username}</td>
                        <td>{emp.firstname}</td>
                        <td>{emp.lastname}</td>
                        <td>{emp.email}</td>
                        <td>{emp.role || "employee"}</td>
                        {canManageEmployees && (
                          <EmployeeActions
                            employee={emp}
                            jwt={jwt}
                            onEdit={() => handleEditEmployee(emp)}
                            onDataChange={handleEmployeeDataChange}
                            permissions={permissions}
                          />
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className={dashboardStyles.no_results}>
                        {serverLanguage?.no_employees_found ?? 'No employees found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPageChange}
                  disabled={isLoading}
                />
              )}
            </>
          )}
        </div>
      </div>

      {employeeModal && (
        <EmployeeModal
          isOpen={employeeModal}
          onClose={handleCloseModal}
          employee={selectedEmployee}
          mode={selectedEmployee ? "edit" : "create"}
          jwt={jwt}
          user={user}
          warehouseCodes={warehouseCodes}
        />
      )}
    </div>
  );
}