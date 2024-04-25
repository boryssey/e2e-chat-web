"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { socket } from "../socket";

const UserPage = () => {
  console.log("user called?");
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

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

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("hello", (data: any) => console.log(data, "hello data"));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <>
      <h1>UserPage</h1>
      <button onClick={() => logoutHandler()}>Logout</button>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Transport: {transport}</p>
    </>
  );
};

export default UserPage;
