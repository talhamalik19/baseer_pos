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
    console.log("==")
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
        
        <div className={style.cardsGrid}>
          {/* Basic Information Card */}
          <div className={style.card}>
            <h3 className={style.cardTitle}>
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
                <span className={style.value}>{existingPosData.pos_phone}</span>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.email ?? "Email:"}</span>
                <span className={`${style.value} ${style.breakAll}`}>{existingPosData.pos_email}</span>
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
              {serverLanguage?.location_address ?? "Location & Address"}
            </h3>
            
            <div className={style.cardContent}>
              <div className={style.addressSection}>
                <span className={style.addressLabel}>{serverLanguage?.address ?? "Address:"}</span>
                <p className={style.addressValue}>
                  {formatAddress(existingPosData.pos_address)}
                </p>
              </div>
              
              <div className={style.infoRow}>
                <span className={style.label}>{serverLanguage?.coordinates ?? "Coordinates:"}</span>
                <span className={style.value}>
                  {existingPosData.latitude}, {existingPosData.longitude}
                </span>
              </div>
              
              <div className={style.infoRow}>
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
              {serverLanguage?.timestamps ?? "Timestamps"}
            </h3>
            
            <div className={style.cardContent}>
              <div className={style.timestampSection}>
                <span className={style.timestampLabel}>{serverLanguage?.created ?? "Created:"}</span>
                <span className={style.value}>
                  {new Date(existingPosData.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className={style.timestampSection}>
                <span className={style.timestampLabel}>{serverLanguage?.last_updated ?? "Last Updated:"}</span>
                <span className={style.value}>
                  {new Date(existingPosData.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={style.buttonContainer}>
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