"use client";

import { useContext, createContext } from "react";

interface IAuthContext {
  user: User;
  logout: () => Promise<Response>;
}

const AuthContext = createContext<IAuthContext | null>(null);

export const useAuthContext = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return authContext;
};
export type User = {
  id: number;
  username: string;
  created_at: Date | null;
  deleted_at: Date | null;
};

const logout = async () =>
  fetch(`${process.env.BACKEND_URL}/auth/logout`, {
    method: "GET",
    credentials: "include",
  });

const AuthProvider = ({
  userInfo,
  children,
}: {
  userInfo: User;
  children: React.ReactNode;
}) => {
  return (
    <AuthContext.Provider
      value={{
        user: userInfo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
