"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function Logo({ lightSrc, darkSrc }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const localTheme = localStorage.getItem("theme") || "light";
    setTheme(localTheme);
  }, []);
  return (
    <Image
      src={theme == "light" ? lightSrc : darkSrc}
      alt={"Baseer logo"}
      width={200}
      height={54}
      style={{ maxWidth: "auto", maxHeight: "auto" }}
    />
  );
}
