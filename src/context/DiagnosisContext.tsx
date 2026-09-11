import React, { createContext, useContext, useEffect, useState } from "react";
import type { DiagnoseResult } from "@/types/diagnose";

export type DiagnosisContextType = {
  diagnostic: DiagnoseResult | null;
  // accept both value or updater function like React.setState
  setDiagnostic: React.Dispatch<React.SetStateAction<DiagnoseResult | null>>;
  geo: any | null;
  setGeo: React.Dispatch<React.SetStateAction<any | null>>;
};

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export const DiagnosisProvider = ({ children }: { children: React.ReactNode }) => {
  const [diagnostic, setDiagnosticState] = useState<DiagnoseResult | null>(null);
  const [geo, setGeoState] = useState<any | null>(null);

  // rehydrate from sessionStorage once on mount
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("diagnosis:result");
      if (s) setDiagnosticState(JSON.parse(s) as DiagnoseResult);
    } catch (e) {
      // ignore
    }
    try {
      const g = sessionStorage.getItem("diagnosis:geo");
      if (g) setGeoState(JSON.parse(g));
    } catch (e) {
      // ignore
    }
  }, []);

  // persist diagnostic
  useEffect(() => {
    try {
      if (diagnostic) sessionStorage.setItem("diagnosis:result", JSON.stringify(diagnostic));
      else sessionStorage.removeItem("diagnosis:result");
    } catch (e) {
      // ignore
    }
  }, [diagnostic]);

  // persist geo
  useEffect(() => {
    try {
      if (geo) sessionStorage.setItem("diagnosis:geo", JSON.stringify(geo));
      else sessionStorage.removeItem("diagnosis:geo");
    } catch (e) {
      // ignore
    }
  }, [geo]);

  const setDiagnostic = setDiagnosticState;
  const setGeo = setGeoState;

  return (
    <DiagnosisContext.Provider value={{ diagnostic, setDiagnostic, geo, setGeo }}>
      {children}
    </DiagnosisContext.Provider>
  );
};

export const useDiagnosis = () => {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error("useDiagnosis must be used within DiagnosisProvider");
  return ctx;
};
