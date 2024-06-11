import { SignalProtocolIndexDBStore } from "@/utils/EncryptedSignalStore";
import AppDB from "@/utils/db";
import { createContext, useContext, useEffect, useState } from "react";
import { encode as encodeBase64 } from "@stablelib/base64";
import PasswordPrompt from "@/components/PasswordPrompt";

interface IDbContext {
  status: StatusType;
  appDB: AppDB;
  signalStore: SignalProtocolIndexDBStore;
}

const DbContext = createContext<IDbContext | null>(null);

export const useDbContext = () => {
  const dbContext = useContext(DbContext);
  if (!dbContext) {
    throw new Error("useDbContext must be used within a SignalProvider");
  }
  return dbContext;
};

type StatusType = "unregistered" | "unauthenticated" | "authenticated";

const makeSecretKey = (key: string) => {
  const encoder = new TextEncoder();
  const newInt8Array = new Uint8Array(32);
  encoder.encodeInto(key, newInt8Array);
  return encodeBase64(newInt8Array);
};

const DbContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [appDB, setAppDB] = useState<AppDB | null>(null);
  const [signalStore, setSignalStore] =
    useState<SignalProtocolIndexDBStore | null>(null);
  const [status, setStatus] = useState<StatusType | null>(null);

  useEffect(() => {
    const init = async () => {
      const isAppDBInitialized = await AppDB.appDBExists();
      if (!isAppDBInitialized) {
        setStatus("unregistered");
        return;
      }
      setStatus("unauthenticated");
    };
    void init();
  }, []);

  const onInitDBs = async (password: string) => {
    const key = makeSecretKey(password); // TODO: use easy-web-crypto for creating a master password
    const appDB = new AppDB(key);
    await appDB.open();
    const localSignalStore = new SignalProtocolIndexDBStore(appDB);
    const existingID = await localSignalStore.getID();
    if (!existingID) {
      const newId = await localSignalStore.createID();
      void socket.emitWithAck("keyBundle:save", newId);
    }
    setSignalStore(localSignalStore);
    setAppDB(appDB);
    setStatus("authenticated");
  };

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
      <DbContext.Provider
        value={{
          status: status,
          appDB: appDB,
          signalStore: signalStore,
        }}
      >
        {children}
      </DbContext.Provider>
    );
  }

  throw new Error("SignalProvider: unexpected state");
};

export default DbContextProvider;
