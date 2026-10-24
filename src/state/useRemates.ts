import { useContext } from "react";
import { RematesCtx } from "@/state/RematesContextValue";

export const useRemates = () => {
  const value = useContext(RematesCtx);
  if (!value) throw new Error("useRemates must be used within RematesProvider");
  return value;
};
