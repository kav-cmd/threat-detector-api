import { createContext, useContext } from "react";

export interface SecurityStatus {
  isDeviceSecure: boolean;
  threats: string[];
  allChecksDone: boolean;
  lastAutoScan: number | null;
  autoScanEnabled: boolean;
}

export const initialSecurityStatus: SecurityStatus = {
  isDeviceSecure: true,
  threats: [],
  allChecksDone: false,
  lastAutoScan: null,
  autoScanEnabled: true,
};

export const SecurityContext = createContext<SecurityStatus>(initialSecurityStatus);

export const useSecurityStatus = () => useContext(SecurityContext);
