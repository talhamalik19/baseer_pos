"use server";

import path from "path";
import os from "os";
import fs from "fs/promises";

const getStoragePath = () => {
  const appName = "pos-system";
  const homeDir = os.homedir();

  switch (process.platform) {
    case "win32":
      return path.join(homeDir, "AppData", "Local", appName);
    case "darwin":
      return path.join(homeDir, "Documents", appName);
    case "linux":
      return path.join(homeDir, `.${appName}`);
    default:
      return path.join(homeDir, appName);
  }
};

const ensureStorageDir = async () => {
  const storagePath = getStoragePath();
  try {
    await fs.mkdir(storagePath, { recursive: true });
  } catch (error) {
    console.error("Error ensuring storage directory:", error);
    throw new Error("Failed to create storage directory");
  }
  return storagePath;
};

export const savePosData = async (data) => {
  try {
    const storagePath = await ensureStorageDir();
    const filePath = path.join(storagePath, "pos-data.json");
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving POS data:", error);
    return false;
  }
};

export const loadPosData = async () => {
  try {
    const storagePath = getStoragePath();
    const filePath = path.join(storagePath, "pos-data.json");

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        console.warn("Path exists but is not a file:", filePath);
        return null;
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn("POS data file not found:", filePath);
        return null;
      } else {
        console.error("Unexpected error checking file existence:", error);
        throw new Error("Failed to access POS data file");
      }
    }

    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading POS data:", error);
    throw new Error("Failed to load POS data");
  }
};
