"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

const UserPage = () => {
  console.log("user called?");
  const router = useRouter();

  const logoutHandler = useCallback(async () => {
    const res = await fetch("http://localhost:3000/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      console.error(res.statusText);
      return;
    }

    // router.push("/");
    router.refresh();
    console.log("logout success");
  }, [router]);

  return (
    <>
      <h1>UserPage</h1>
      <button onClick={() => logoutHandler()}>Logout</button>
    </>
  );
};

export default UserPage;
