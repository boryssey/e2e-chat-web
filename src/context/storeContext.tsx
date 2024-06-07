import { SignalProtocolIndexDBStore } from "@/utils/EncryptedSignalStore";
import AppDB from "@/utils/db";
import { createContext, useContext, useEffect, useState } from "react";
import { encode as encodeBase64 } from "@stablelib/base64";
import PasswordPrompt from "@/components/PasswordPrompt";

interface IStoreContext {
  status: StatusType;
  appDB: AppDB;
  signalStore: SignalProtocolIndexDBStore;
}

const StoreContext = createContext<IStoreContext | null>(null);

export const useStoreContext = () => {
  const signalContext = useContext(StoreContext);
  if (!signalContext) {
    throw new Error("useSignalContext must be used within a SignalProvider");
  }
  return signalContext;
};

type StatusType = "unregistered" | "unauthenticated" | "authenticated";

const makeSecretKey = (key: string) => {
  const encoder = new TextEncoder();
  const newInt8Array = new Uint8Array(32);
  encoder.encodeInto(key, newInt8Array);
  return encodeBase64(newInt8Array);
};

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  // appDb
  const [appDB, setAppDB] = useState<AppDB | null>(null);
  const [signalStore, setSignalStore] =
    useState<SignalProtocolIndexDBStore | null>(null);
  const [status, setStatus] = useState<StatusType | null>(null);

  useEffect(() => {
    const init = async () => {
      const isAppDBInitialized = await AppDB.appDBExists();
      console.log("🚀 ~ init ~ isAppDBInitialized:", isAppDBInitialized);
      if (!isAppDBInitialized) {
        setStatus("unregistered");
        return;
      }
      setStatus("unauthenticated");
    };
    init();
  }, []);

  const onInitDBs = async (password: string) => {
    console.log(password, "password");
    const key = makeSecretKey(password); // use easy-web-crypto for creating a master password
    console.log("🚀 ~ init ~ key:", key);
    const appDB = new AppDB(key);
    await appDB.open();
    const localSignalStore = new SignalProtocolIndexDBStore(appDB); // use AppDB for signal store
    setSignalStore(localSignalStore);
    setAppDB(appDB);
    setStatus("authenticated");
  };
  console.log("re-render");

  if (!status) {
    return <div>Loading...</div>;
  }

  if (status === "unregistered") {
    return (
      <PasswordPrompt
        promptLabel={
          "Please enter a password that will be used to encrypt your local database"
        }
        withConfirmation
        onSubmit={onInitDBs}
      />
    );
  }
  if (status === "unauthenticated") {
    return (
      <PasswordPrompt
        promptLabel={"Please enter your password to decrypt the database"}
        onSubmit={onInitDBs}
      />
    );
  }

  if (appDB && signalStore) {
    return (
      <StoreContext.Provider
        value={{
          status: status,
          appDB: appDB,
          signalStore: signalStore,
        }}
      >
        {children}
      </StoreContext.Provider>
    );
  }

  throw new Error("SignalProvider: unexpected state");
};

export default StoreProvider;
