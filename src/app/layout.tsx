import type { Metadata } from "next";

import "./globals.scss";
import biotif from "./font";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

const getUserInfo = async () => {
  const cookieStore = cookies();

  const res = await fetch("http://localhost:3000/auth/me", {
    headers: {
      Cookie: cookieStore.toString(),
    },
    credentials: "include",
  });
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  console.error(res.statusText);
  return null;
};

export default async function RootLayout({
  guest,
  user,
}: Readonly<{
  children: React.ReactNode;
  guest: React.ReactNode;
  user: React.ReactNode;
}>) {
  const userInfo = await getUserInfo();
  console.log("🚀 ~ userInfo:", userInfo);

  return (
    <html lang="en">
      <body className={biotif.className}>{userInfo ? user : guest}</body>
    </html>
  );
}
