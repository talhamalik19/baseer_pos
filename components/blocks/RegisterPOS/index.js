"use client";
import React, { useEffect, useRef, useState } from "react";
import style from "../Setting/setting.module.scss";
import { getPOSDataAction } from "@/lib/Magento/actions";
import { savePosData } from "@/lib/posStorage";

export default function RegisterPOS({
  jwt,
  macAddress,
  redirectSource,
  macAddresses,
  pos_code,
  codes,
  serverLanguage
}) {
  const [posCode, setPosCode] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const [ipAddress, setIpAddress] = useState('');
  const [assignedPOS, setAssignedPOS] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [warehouseDetail, setWarehouseDetail] = useState({})
  
  // New states for managing existing POS data
  const [existingPosData, setExistingPosData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeComponent = () => {
      const loginDetail = JSON.parse(localStorage.getItem("loginDetail"));
      setIpAddress(loginDetail?.client_ip);
      setWarehouseDetail(loginDetail?.warehouse)
      setAssignedPOS(codes);
      
      // Check for existing POS data in localStorage
      const companyDetail = localStorage.getItem("company_detail");
      if (companyDetail) {
        try {
          const parsedData = JSON.parse(companyDetail);
          setExistingPosData(parsedData);
          setShowForm(false);
        } catch (error) {
          console.error("Error parsing company_detail from localStorage:", error);
          setShowForm(true);
        }
      } else {
        setShowForm(true);
      }
      
      // Small delay to prevent jerky loading
      setTimeout(() => {
        setIsInitializing(false);
      }, 100);
    };

    initializeComponent();
  }, [codes]);
  
  const filteredCodes = assignedPOS?.filter((code) =>
    code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setError = (msg) => setMessage({ type: "error", text: msg });
  const setSuccess = (msg) => setMessage({ type: "success", text: msg });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({ type: "", text: "" });

    if (!posCode.trim()) {
      setError(serverLanguage?.pos_code_required ?? "POS Code is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pos_code: posCode,
          ip_address: ipAddress,
        }),
      });
      const result = await res.json();
      
      if (result?.success) {
        const data = result?.data;
        const { posData, jsonData } = data;
        const posCode = posData?.pos_code;
        
        // Save to localStorage
        localStorage.setItem("pos_code", posCode);
        localStorage.setItem("company_detail", JSON.stringify(posData));
        localStorage.setItem("jsonData", JSON.stringify(jsonData));
        
        // Show success message
        setSuccess(serverLanguage?.pos_registered_success ?? "POS registered successfully. Refreshing page...");
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } else {
        const errorMsg = result?.message;
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      setError(serverLanguage?.something_went_wrong ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleReAssign = () => {
    if(typeof window != undefined){
      const pos = localStorage.getItem("pos_code");
      setPosCode(pos)
    }
    setShowForm(true);
    setMessage({ type: "", text: "" });
    setSearch("");
  };

  const formatAddress = (address) => {
    if (!address) return serverLanguage?.not_available ?? "N/A";
    const { firstname, lastname, street, city, country_id, postcode, region } = address;
    return `${firstname} ${lastname}, ${street}, ${city}, ${region}, ${country_id} ${postcode}`;
  };

  if (isInitializing) {
    return (
      <div className={`${style.block} page_detail`}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          fontSize: "16px",
          color: "#666"
        }}>
          {serverLanguage?.loading ?? "Loading..."}
        </div>
      </div>
    );
  }

  const containerStyle = {
    opacity: isInitializing ? 0 : 1,
    transition: "opacity 0.3s ease-in-out",
  };

  if (existingPosData && !showForm) {
    return (
      <div className={`${style.block} page_detail`} style={containerStyle}>
        <div className={style.header}>
          <div className={style.secHead}>
          <h2 className={`${style.title} ${style.manage_title}`}>
            {`${serverLanguage?.pos_details ?? "POS Details"} ${warehouseDetail && `${serverLanguage?.for ?? "for"} ${warehouseDetail?.name}`}`}
          </h2>
          <div className={`${style.statusBadge} ${existingPosData.pos_status === 1 ? style.active : style.inactive}`}>
            {existingPosData.pos_status === 1 ? 
              `● ${serverLanguage?.active ?? "Active"}` : 
              `● ${serverLanguage?.inactive ?? "Inactive"}`
            }
          </div>
          </div>
            <p className={style.des}>Complete information about this POS location</p>
        </div>
        
        <div className={style.cardsGrid}>
          {/* Basic Information Card */}
          <div className={style.card}>
            <h3 className={style.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.6667 6.66667C10.6667 7.37392 10.3858 8.05219 9.88566 8.55229C9.38556 9.05239 8.70728 9.33334 8.00004 9.33334C7.2928 9.33334 6.61452 9.05239 6.11442 8.55229C5.61433 8.05219 5.33337 7.37392 5.33337 6.66667" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2.0686 4.02266H13.9313" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2.26667 3.64466C2.09357 3.87546 2 4.15617 2 4.44466V13.3333C2 13.6869 2.14048 14.0261 2.39052 14.2761C2.64057 14.5262 2.97971 14.6667 3.33333 14.6667H12.6667C13.0203 14.6667 13.3594 14.5262 13.6095 14.2761C13.8595 14.0261 14 13.6869 14 13.3333V4.44466C14 4.15617 13.9064 3.87546 13.7333 3.64466L12.4 1.86666C12.2758 1.70107 12.1148 1.56666 11.9296 1.47409C11.7445 1.38152 11.5403 1.33333 11.3333 1.33333H4.66667C4.45967 1.33333 4.25552 1.38152 4.07038 1.47409C3.88524 1.56666 3.7242 1.70107 3.6 1.86666L2.26667 3.64466Z" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              {serverLanguage?.basic_information ?? "Basic Information"}
            </h3>
            
            <div className={style.cardContent}>
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.pos_code ?? "POS Code:"}</span>
                <span className={style.value}>{existingPosData.pos_code}</span>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.entity_id ?? "Entity ID:"}</span>
                <span className={style.value}>{existingPosData.entity_id}</span>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.phone ?? "Phone:"}</span>
                <a href={`tel:${existingPosData.pos_phone}`} className={`${style.value} ${style.link}`}>{existingPosData.pos_phone}</a>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.email ?? "Email:"}</span>
                <a href={`mailto:${existingPosData?.pos_email}`} className={`${style.value} ${style.link} ${style.breakAll}`}>{existingPosData.pos_email}</a>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.warehouse ?? "Warehouse:"}</span>
                <span className={style.value}>{existingPosData.warehouse_code}</span>
              </div>
            </div>
          </div>

          {/* Location Information Card */}
          <div className={style.card}>
            <h3 className={style.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.3334 6.66666C13.3334 9.99533 9.64069 13.462 8.40069 14.5327C8.28517 14.6195 8.14455 14.6665 8.00002 14.6665C7.85549 14.6665 7.71487 14.6195 7.59935 14.5327C6.35935 13.462 2.66669 9.99533 2.66669 6.66666C2.66669 5.25217 3.22859 3.89562 4.22878 2.89543C5.22898 1.89523 6.58553 1.33333 8.00002 1.33333C9.41451 1.33333 10.7711 1.89523 11.7713 2.89543C12.7715 3.89562 13.3334 5.25217 13.3334 6.66666Z" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 8.66667C9.10457 8.66667 10 7.77124 10 6.66667C10 5.5621 9.10457 4.66667 8 4.66667C6.89543 4.66667 6 5.5621 6 6.66667C6 7.77124 6.89543 8.66667 8 8.66667Z" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              {serverLanguage?.location_address ?? "Location & Address"}
            </h3>
            
            <div className={style.cardContent}>
              <div className={style.addressSection}>
                <span className={style.label}>{serverLanguage?.address ?? "Address:"}</span>
                <p className={style.addressValue}>
                  {formatAddress(existingPosData.pos_address)}
                </p>
              </div>
              
              <div className={style.addressSection}>
                <span className={style.label}>{serverLanguage?.coordinates ?? "Coordinates:"}</span>
                <span className={style.value}>
                  {existingPosData.latitude}, {existingPosData.longitude}
                </span>
              </div>
              
              <div className={style.addressSection}>
                <span className={style.label}>{serverLanguage?.ip_address ?? "IP Address:"}</span>
                <span className={`${style.value} ${style.ipAddress}`}>
                  {existingPosData.ip_address}
                </span>
              </div>
            </div>
          </div>

          {/* Settings & Permissions Card */}
          <div className={style.card}>
            <h3 className={style.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.3334 6.66666C13.3334 9.99533 9.64069 13.462 8.40069 14.5327C8.28517 14.6195 8.14455 14.6665 8.00002 14.6665C7.85549 14.6665 7.71487 14.6195 7.59935 14.5327C6.35935 13.462 2.66669 9.99533 2.66669 6.66666C2.66669 5.25217 3.22859 3.89562 4.22878 2.89543C5.22898 1.89523 6.58553 1.33333 8.00002 1.33333C9.41451 1.33333 10.7711 1.89523 11.7713 2.89543C12.7715 3.89562 13.3334 5.25217 13.3334 6.66666Z" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 8.66667C9.10457 8.66667 10 7.77124 10 6.66667C10 5.5621 9.10457 4.66667 8 4.66667C6.89543 4.66667 6 5.5621 6 6.66667C6 7.77124 6.89543 8.66667 8 8.66667Z" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              {serverLanguage?.settings_permissions ?? "Settings & Permissions"}
            </h3>
            <div className={style.cardContent}>
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.shipping_method ?? "Shipping Method:"}</span>
                <span className={style.value}>{existingPosData.pos_shipping_method}</span>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.discount_allowed ?? "Discount Allowed:"}</span>
                <span className={`${style.value} ${existingPosData.discount_allowed ? style.success : style.error}`}>
                  {existingPosData.discount_allowed ? 
                    `✓ ${serverLanguage?.yes ?? "Yes"}` : 
                    `✗ ${serverLanguage?.no ?? "No"}`
                  }
                </span>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.tax_allowed ?? "Tax Allowed:"}</span>
                <span className={`${style.value} ${existingPosData.tax_allowed ? style.success : style.error}`}>
                  {existingPosData.tax_allowed ? 
                    `✓ ${serverLanguage?.yes ?? "Yes"}` : 
                    `✗ ${serverLanguage?.no ?? "No"}`
                  }
                </span>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.tax_percent ?? "Tax Percent:"}</span>
                <span className={style.value}>{existingPosData.tax_percent}%</span>
              </div>
            </div>
          </div>

          {/* Timestamps Card */}
          <div className={style.card}>
            <h3 className={style.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 4V8L10.6667 9.33333" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.99998 14.6666C11.6819 14.6666 14.6666 11.6819 14.6666 7.99998C14.6666 4.31808 11.6819 1.33331 7.99998 1.33331C4.31808 1.33331 1.33331 4.31808 1.33331 7.99998C1.33331 11.6819 4.31808 14.6666 7.99998 14.6666Z" stroke="#009689" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              {serverLanguage?.timestamps ?? "Timestamps"}
            </h3>
            
            <div className={style.cardContent}>
              <div className={style.addressSection}>
                <span className={style.label}>{serverLanguage?.created ?? "Created:"}</span>
                <span className={style.value}>
                  {new Date(existingPosData.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className={style.addressSection}>
                <span className={style.label}>{serverLanguage?.last_updated ?? "Last Updated:"}</span>
                <span className={style.value}>
                  {new Date(existingPosData.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={style.buttonContainer}>
          <div className={style.text}>
            <p>Need to Make Changes?</p>
                <p>Update POS settings, reassign location, or modify permissions</p>
          </div>
          <button 
            onClick={handleReAssign}
            className={style.reassignButton}
          >
            {serverLanguage?.re_assign_pos ?? "Re-Assign POS"}
          </button>
        </div>
        
        {message.text && (
          <div className={`${style.message} ${message.type === "error" ? style.messageError : style.messageSuccess}`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={'page_detail'}>
      <div className={`${style.block} ${style.form_block}`} style={containerStyle}>
        <div style={{
          paddingBottom: "16px",
          marginBottom: "24px"
        }}>
          <h2 style={{ 
            margin: 0, 
            color: "#2c3e50", 
            fontSize: "28px", 
            fontWeight: "600" 
          }} className={`${style.title} ${style.manage_title}`}>
            {existingPosData ? 
              `${serverLanguage?.reassign_pos ?? "Re-Assign POS"} ${warehouseDetail && `${serverLanguage?.for ?? "for"} ${warehouseDetail?.name}`}` : 
              `${serverLanguage?.assign_new_pos ?? "Assign New POS"} ${warehouseDetail && `${serverLanguage?.for ?? "for"} ${warehouseDetail?.name}`}`
            }
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
          {assignedPOS?.length > 0 ? (
            <div className={style.manage_block}>
              <p>{serverLanguage?.pos_code ?? "POS Code"}</p>
              <div
                ref={wrapperRef}
                style={{
                  position: "relative",
                  maxWidth: "400px",
                  width: "100%",
                }}
              >
                <div
                  onClick={() => setIsOpen((prev) => !prev)}
                  style={{
                    backgroundColor: "#ffffff",
                    outline: "none",
                    border: "1px solid #D8DCE2",
                    width: "100%",
                    height: "56px",
                    borderRadius: "10px",
                    padding: "0px 20px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    justifyContent: "space-between",
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 20px center",
                    backgroundSize: "25px",
                    transition: "border-color 0.3s ease"
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = "#007bff"}
                  onMouseLeave={(e) => e.target.style.borderColor = "#D8DCE2"}
                >
                  {posCode || `-- ${serverLanguage?.select_pos_code ?? "Select a POS Code"} --`}
                </div>

                {isOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "60px",
                      left: 0,
                      right: 0,
                      backgroundColor: "#fff",
                      border: "1px solid #D8DCE2",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflowY: "auto",
                      animation: "fadeIn 0.2s ease-out"
                    }}
                  >
                    <input
                      type="text"
                      placeholder={serverLanguage?.search ?? "Search..."}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 20px",
                        border: "none",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />

                    {filteredCodes.length === 0 && (
                      <div style={{ padding: "10px 20px", color: "#999" }}>
                        {serverLanguage?.no_results_found ?? "No results found"}
                      </div>
                    )}

                    {filteredCodes.map((code, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setPosCode(code);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        style={{
                          padding: "10px 20px",
                          cursor: "pointer",
                          backgroundColor: posCode === code ? "#f0f0f0" : "#fff",
                          transition: "background-color 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = posCode === code ? "#f0f0f0" : "#fff"}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={style.manage_block}>
              <p>{serverLanguage?.pos_code ?? "POS Code"}</p>
              <input
                type="text"
                name="posCode"
                value={posCode}
                onChange={(e) => setPosCode(e.target.value)}
                style={{
                  transition: "border-color 0.3s ease"
                }}
              />
            </div>
          )}

          <div className={style.manage_block}>
            <p>{serverLanguage?.ip_address ?? "IP Address"}</p>
            <input
              type="text"
              value={ipAddress}
              className={style.disabled}
              readOnly
            />
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "20px" }} className={style.resgister_button}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                color: "white",
                padding: "14px 28px",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 
                serverLanguage?.registering ?? "Registering..." : 
                existingPosData ? 
                  serverLanguage?.re_assign_pos ?? "Re-Assign POS" : 
                  serverLanguage?.connect_pos ?? "Connect POS"
              }
            </button>

            {existingPosData && (
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                style={{
                  color: "white",
                  padding: "14px 28px",
                  border: "none",
                  backgroundColor: "#595959",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  transition: "all 0.3s ease"
                }}
              >
                {serverLanguage?.cancel ?? "Cancel"}
              </button>
            )}
          </div>

          {message.text && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                borderRadius: "8px",
                color: message.type === "error" ? "#721c24" : "#155724",
                border: `1px solid ${message.type === "error" ? "#f5c6cb" : "#c3e6cb"}`,
                fontWeight: "500"
              }}
            >
              {message.text}
            </div>
          )}

          {redirectSource && (
            <div style={{ 
              color: "#dc3545", 
              marginTop: "20px",
              padding: "12px 16px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "8px",
              fontWeight: "500"
            }}>
              {serverLanguage?.register_to_place_order ?? "Please register a POS to place order."}
            </div>
          )}
        </form>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}