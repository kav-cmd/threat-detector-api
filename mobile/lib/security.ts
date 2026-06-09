import { createContext, useContext } from "react";

export interface SecurityStatus {
  isDeviceSecure: boolean;
  threats: string[];
  allChecksDone: boolean;
}

export const initialSecurityStatus: SecurityStatus = {
  isDeviceSecure: true,
  threats: [],
  allChecksDone: false,
};

export const SecurityContext = createContext<SecurityStatus>(initialSecurityStatus);

export const useSecurityStatus = () => useContext(SecurityContext);
