import React, { createContext, useContext, useEffect, useState } from "react";
import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";

export type DiagnosisContextType = {
  diagnostic: DiagnoseResult | null;
  // accept both value or updater function like React.setState
  setDiagnostic: React.Dispatch<React.SetStateAction<DiagnoseResult | null>>;
  diagnosticReportId: string | null;
  setDiagnosticReportId: React.Dispatch<React.SetStateAction<string | null>>;
  geo: unknown;
  setGeo: React.Dispatch<React.SetStateAction<unknown>>;
  /** False until the saved session data was read, so pages can tell "empty" from "not loaded yet". */
  isHydrated: boolean;
};

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export const DiagnosisProvider = ({ children }: { children: React.ReactNode }) => {
  const [diagnostic, setDiagnosticState] = useState<DiagnoseResult | null>(null);
  const [diagnosticReportId, setDiagnosticReportId] = useState<string | null>(
    null,
  );
  const [geo, setGeoState] = useState<unknown>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // rehydrate from sessionStorage once on mount
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("diagnosis:result");
      if (s) setDiagnosticState(JSON.parse(s) as DiagnoseResult);
    } catch (error) {
      console.warn("Unable to restore the saved diagnostic result.", error);
    }
    try {
      const g = sessionStorage.getItem("diagnosis:geo");
      if (g) setGeoState(JSON.parse(g));
    } catch (error) {
      console.warn("Unable to restore the saved GEO result.", error);
    }
    try {
      setDiagnosticReportId(sessionStorage.getItem("diagnosis:report-id"));
    } catch (error) {
      console.warn("Unable to restore the saved diagnostic report link.", error);
    }
    setIsHydrated(true);
  }, []);

  // persist diagnostic
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (diagnostic) sessionStorage.setItem("diagnosis:result", JSON.stringify(diagnostic));
      else sessionStorage.removeItem("diagnosis:result");
    } catch (error) {
      console.warn("Unable to save the diagnostic result.", error);
    }
  }, [diagnostic, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (diagnosticReportId) {
        sessionStorage.setItem("diagnosis:report-id", diagnosticReportId);
      } else {
        sessionStorage.removeItem("diagnosis:report-id");
      }
    } catch (error) {
      console.warn("Unable to save the diagnostic report link.", error);
    }
  }, [diagnosticReportId, isHydrated]);

  // persist geo
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (geo) sessionStorage.setItem("diagnosis:geo", JSON.stringify(geo));
      else sessionStorage.removeItem("diagnosis:geo");
    } catch (error) {
      console.warn("Unable to save the GEO result.", error);
    }
  }, [geo, isHydrated]);

  const setDiagnostic = setDiagnosticState;
  const setGeo = setGeoState;

  return (
    <DiagnosisContext.Provider
      value={{
        diagnostic,
        setDiagnostic,
        diagnosticReportId,
        setDiagnosticReportId,
        geo,
        setGeo,
        isHydrated,
      }}
    >
      {children}
    </DiagnosisContext.Provider>
  );
};

/** Same data as useDiagnosis, or undefined outside the provider (shared widgets must not crash). */
export const useOptionalDiagnosis = () => useContext(DiagnosisContext);

export const useDiagnosis = () => {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error("useDiagnosis must be used within DiagnosisProvider");
  return ctx;
};
