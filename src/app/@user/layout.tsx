"use client";
import SignalProvider from "@/context/signalContext";

const UserLayout = ({
  children,
  chat,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
}) => {
  console.log("user layout");
  return <SignalProvider>{children}</SignalProvider>;
};

export default UserLayout;
