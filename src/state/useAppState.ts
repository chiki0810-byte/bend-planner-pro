import { useContext } from "react";
import { AppStateValueContext } from "@/state/AppStateValueContext";

export const useAppState = () => {
  const value = useContext(AppStateValueContext);
  if (!value) throw new Error("useAppState must be used within AppStateProvider");
  return value;
};
