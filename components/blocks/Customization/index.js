"use client";

import { useEffect, useState } from "react";
import { getPDFSettings } from "@/lib/indexedDB";
import { savePOSDataAction } from "@/lib/Magento/actions";
import styles from "./customization.module.scss";

export default function CustomizePdf({ jwt , serverLanguage}) {
  const posCode = localStorage.getItem("pos_code");
  let posDetail = {};

  try {
    const customizeData = localStorage.getItem("customize_json");
    const companyData = localStorage.getItem("loginDetail");

    if (customizeData) {
      const parsed = JSON.parse(customizeData);
      posDetail = {
        title: parsed.title || "",
        subtitle: parsed.subtitle || "",
        logo: parsed.logo || "",
        companyName: parsed.companyName || "",
        posCode: parsed.posCode || "",
        address: parsed.address || "",
        city: parsed.city || "",
        state: parsed.state || "",
        zipCode: parsed.zipCode || "",
        phone: parsed.phone || "",
        email: parsed.email || "",
        longitude: parsed.longitude || "",
        latitude: parsed.latitude || "",
        footer: parsed.footer || "",
        footerText: parsed.footerText || "",
      };
    } else if (companyData) {
      const parsed = JSON.parse(companyData)?.warehouse;
     posDetail = {
    title: parsed?.header_title || "",
    subtitle: parsed?.header_subtitle || "",
    logo: "",
    companyName: parsed?.warehouse_name || "",
    posCode: parsed?.warehouse_code || "",
    address: parsed?.street_address || "",
    city: parsed?.city || "",
    state: parsed?.state || "",
    zipCode: parsed?.zip_code || "",
    phone: parsed?.contact || "",
    email: "",
    longitude: parsed?.long || "",
    latitude: parsed?.lat || "",
    footer: parsed?.footer_title || "",
    footerText: parsed?.footer_subtitle || "",
};
    }
  } catch (error) {
    console.error("Invalid JSON in localStorage (customize_json or company_detail)", error);
  }

  const [form, setForm] = useState(posDetail);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getPDFSettings();
      if (settings) setForm(settings);
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      pos_code: posCode,
      data: form
    }
    const response = await savePOSDataAction(data);
  const [status, responseData] = response;

if (status === true) {
  const firstKey = Object.keys(responseData)[0];
  const jsonData = responseData[firstKey]?.data?.jsonData;

  if (jsonData) {
    localStorage.setItem("customize_json", JSON.stringify(jsonData));
    localStorage.setItem("jsonData", JSON.stringify(jsonData));
    setSaved(true);
  }
}
  };

  return (
    <div className="page_detail">
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Header */}
        <h2 className={styles.sectionHeading}>{serverLanguage?.customize_pdf ?? 'Customize PDF'}</h2>
        
        <div className={styles.row}>
          <div className={styles.inputField}>
            <label htmlFor="title">{serverLanguage?.pdf_header_title ?? 'PDF Header Title'}</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
          <div className={styles.inputField}>
            <label htmlFor="subtitle">{serverLanguage?.pdf_header_subtitle ?? 'PDF Header Subtitle'}</label>
            <input
              id="subtitle"
              name="subtitle"
              type="text"
              value={form.subtitle}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.inputField}>
            <label htmlFor="footer">{serverLanguage?.pdf_footer_title ?? 'PDF Footer Title'}</label>
            <input
              id="footer"
              name="footer"
              type="text"
              value={form.footer}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
          <div className={styles.inputField}>
            <label htmlFor="footerText">{serverLanguage?.pdf_footer_text ?? 'PDF Footer Text'}</label>
            <input
              id="footerText"
              name="footerText"
              type="text"
              value={form.footerText}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
        </div>

        {/* Company Info */}
        <h2 className={styles.sectionHeading}>{serverLanguage?.company_info ?? 'Company Info'}</h2>
        
        <div className={styles.inputField}>
          <label htmlFor="logo">{serverLanguage?.upload_logo ?? 'Upload Logo'}</label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className={styles.formControl}
          />
        </div>

        {form.logo && (
          <div className={styles.preview}>
            <p>Preview:</p>
            <img src={form.logo} alt="Logo Preview" width={100} />
          </div>
        )}

        <div className={styles.inputField}>
          <label htmlFor="companyName">{serverLanguage?.company_name ?? 'Company Name'}</label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            value={form.companyName}
            onChange={handleChange}
            className={styles.formControl}
          />
        </div>

        <div className={styles.inputField}>
          <label htmlFor="posCode">{serverLanguage?.pos_code ?? 'POS Code'}</label>
          <input
            id="posCode"
            name="posCode"
            type="text"
            value={form.posCode}
            onChange={handleChange}
            className={`${styles.formControl} ${styles.readOnlyInput}`}
            readOnly
          />
        </div>

        <div className={styles.inputField}>
          <label htmlFor="address">{serverLanguage?.address ?? 'Address'}</label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            className={styles.formControl}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.inputField}>
            <label htmlFor="city">{serverLanguage?.city ?? 'City'}</label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
          <div className={styles.inputField}>
            <label htmlFor="state">{serverLanguage?.state ?? 'State'}</label>
            <input
              id="state"
              name="state"
              type="text"
              value={form.state}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
          <div className={styles.inputField}>
            <label htmlFor="zipCode">{serverLanguage?.zip_code ?? 'Zip Code'}</label>
            <input
              id="zipCode"
              name="zipCode"
              type="text"
              value={form.zipCode}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.inputField}>
            <label htmlFor="phone">{serverLanguage?.phone ?? 'Phone'}</label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={form.phone}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
          <div className={styles.inputField}>
            <label htmlFor="email">{serverLanguage?.email ?? 'Email'}</label>
            <input
              id="email"
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
              className={styles.formControl}
            />
          </div>
        </div>

        {/* Store Location */}
        <h2 className={styles.sectionHeading}>{serverLanguage?.store_location ?? 'Store Location'}</h2>
        
        <div className={styles.row}>
          <div className={styles.inputField}>
            <label htmlFor="longitude">{serverLanguage?.longitude ?? 'Longitude'}</label>
            <input
              id="longitude"
              name="longitude"
              type="text"
              value={form.longitude}
              onChange={handleChange}
              className={`${styles.formControl} ${styles.readOnlyInput}`}
              readOnly
            />
          </div>
          <div className={styles.inputField}>
            <label htmlFor="latitude">{serverLanguage?.latitude ?? 'Latitude'}</label>
            <input
              id="latitude"
              name="latitude"
              type="text"
              value={form.latitude}
              onChange={handleChange}
              className={`${styles.formControl} ${styles.readOnlyInput}`}
              readOnly
            />
          </div>
        </div>

        {saved && <div className={styles.success}>Settings Saved!</div>}

        <div className={styles.buttonContainer}>
          <button className={styles.submitButton} type="submit">
            {serverLanguage?.save_settings ?? 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
