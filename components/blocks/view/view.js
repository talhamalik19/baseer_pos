"use client";
import React, { useState, useEffect } from "react";
import { saveViewMode, getViewMode } from "@/lib/indexedDB";
import styles from "./ViewSelector.module.scss";

const ViewSelector = () => {
  const [viewMode, setViewMode] = useState("category");

  useEffect(() => {
    const fetchViewMode = async () => {
      const mode = await getViewMode();
      setViewMode(mode);
    };
    fetchViewMode();
  }, []);

  const handleChange = async (event) => {
    const selectedMode = event.target.value;
    setViewMode(selectedMode);
    await saveViewMode(selectedMode);
  };

  return (
    <div className={`${styles.viewSelector} page_detail section_padding`}>
      <h3>Select View for Products</h3>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          name="view"
          value="cards"
          checked={viewMode === "cards"}
          onChange={handleChange}
          className={styles.radioInput}
        />
        <span className={styles.customRadio}></span>
        Cards View
      </label>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          name="view"
          value="table"
          checked={viewMode === "table"}
          onChange={handleChange}
          className={styles.radioInput}
        />
        <span className={styles.customRadio}></span>
        Table View
      </label>
    </div>
  );
};

export default ViewSelector;
