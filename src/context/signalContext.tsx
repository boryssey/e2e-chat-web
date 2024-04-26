import { createContext, useContext } from "react";

const defaultSignalContext = {};

const SignalContext = createContext(defaultSignalContext);

export const useSignalContext = () => {
  return useContext(SignalContext);
};

const SignalProvider = ({ children }: { children: React.ReactNode }) => {
  return <SignalContext.Provider value={{}}>{children}</SignalContext.Provider>;
};

export default SignalProvider;
