"use client";

import { createContext, useState, useContext } from "react";

const context = createContext();

export const ContextProvider = ({ children }) => {
  const [state, setState] = useState(false);
  const [stats, setStats] = useState('YEARLY');

  return (
    <context.Provider value={{ state, setState, stats, setStats }}>
      {children}
    </context.Provider>
  );
};

export const useMyContext = () => useContext(context);
