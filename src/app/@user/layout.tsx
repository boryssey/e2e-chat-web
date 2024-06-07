"use client";
import StoreProvider from "@/context/storeContext";

const UserLayout = ({
  children,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
}) => {
  return <StoreProvider>{children}</StoreProvider>;
};

export default UserLayout;
