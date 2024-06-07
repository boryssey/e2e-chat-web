//authContext
import {
  Direction,
  KeyPairType,
  PreKeyType,
  SignalProtocolAddress,
  StorageType,
} from "@privacyresearch/libsignal-protocol-typescript";
import AppDB from "./db";

/*
    Examples are: 
    https://github.dev/privacyresearchgroup/libsignal-typescript-demo/blob/master/simple/src/storage-type.ts#L5
    
    or 

    https://github.com/signalapp/Signal-Desktop/blob/ce83195170047aae754c225a89d75de56bd953e0/ts/sql/Interface.ts#L71

*/



export function arrayBufferToString(b: ArrayBuffer): string {
  return uint8ArrayToString(new Uint8Array(b));
}

export function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export function uint8ArrayToString(arr: Uint8Array): string {
  const end = arr.length;
  let begin = 0;
  if (begin === end) return "";
  let chars: number[] = [];
  const parts: string[] = [];
  while (begin < end) {
    chars.push(arr[begin++]);
    if (chars.length >= 1024) {
      parts.push(String.fromCharCode(...chars));
      chars = [];
    }
  }
  return parts.join("") + String.fromCharCode(...chars);
}

function isArrayBuffer(thing: StoreValue): boolean {
  const t = typeof thing;
  return (
    !!thing &&
    t !== "string" &&
    t !== "number" &&
    "byteLength" in (thing as any)
  );
}

export function isKeyPairType(kp: any): kp is KeyPairType {
  return !!(kp?.privKey && kp?.pubKey);
}

type StoreValue =
  | string
  | number
  | KeyPairType
  | PreKeyType
  | ArrayBuffer
  | undefined;

export class SignalProtocolIndexDBStore implements StorageType {
  private _store;
  static dbName = "signal-store";

  constructor(appDB: AppDB) {
    this._store = appDB;
  }
  
  public static storeExists = async () => {
    return (await window.indexedDB.databases()).map(db => db.name).includes(SignalProtocolIndexDBStore.dbName);
  }

  private async get(key: string) {
    return (await this._store.signalStoreItems.get(key))?.value;
    // return get(key, this._store);
  }

  private async set(key: string, value: StoreValue) {
    await this._store.signalStoreItems.put({key, value});
    // return set(key, value, this._store);
  }

  private async del(key: string) {
    return this._store.signalStoreItems.delete(key);
  }

  async getIdentityKeyPair(): Promise<KeyPairType | undefined>{
    const keyPair = await this.get("identityKey");
    if (isKeyPairType(keyPair)) {
      return keyPair;
    }
    return undefined;
  }

  getLocalRegistrationId = async () => {
    const localRegistrationId = await this.get("registrationId");
    console.log("🚀 ~ SignalProtocolIndexDBStore ~ getLocalRegistrationId= ~ localRegistrationId:", localRegistrationId)
    if(localRegistrationId && !isNaN(+localRegistrationId)) {
      return Number(localRegistrationId);
    }
    return undefined;
  }

  saveLocalRegistrationId = async (id: string) => {
    return this.set("registrationId", id);
  }

  async saveIdentityKeyPair(keyPair: KeyPairType) {
    return this.set("identityKey", keyPair);
  } 

  async getOneTimePreKeys() {
    const allKeys = (await this._store.signalStoreItems.toCollection().keys()) as Array<string>;
    const oneTimeKeys = Promise.all(allKeys.filter((key) => key.startsWith("preKey:")).map(async (key) => this.get(key)));
    return oneTimeKeys;
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    _direction: Direction
  ) {
    if (!identifier || !identityKey) {
      throw new Error("identifier or identityKey is missing");
    }

    const trusted = await this.get("identifierKey:" + identifier);

    if (!trusted) {
      // no previous conversation with this identity
      return true;
    }

    // check if the identity key is the same
    return Promise.resolve(
      arrayBufferToString(identityKey) ===
        arrayBufferToString(trusted as ArrayBuffer)
    );

    // return true;
  }

  async saveIdentity(
    encodedAddress: string,
    publicKey: ArrayBuffer,
    _nonblockingApproval?: boolean | undefined
  ) {
    const address = SignalProtocolAddress.fromString(encodedAddress);
    if (!address) {
      throw new Error("Address is missing");
    }
    const existing = await this.get("identifierKey:" + address.name);
    this.set("identifierKey:" + address.name, publicKey);

    if (existing && !isArrayBuffer(existing)) {
      throw new Error("public identity key is not of correct type");
    }

    if (
      existing &&
      arrayBufferToString(publicKey) !==
        arrayBufferToString(existing as ArrayBuffer)
    ) {
      return true;
    }

    return false;
  }

  async loadPreKey(encodedAddress: string | number) {
    const savedPreKey = await this.get("preKey:" + encodedAddress);
    console.log("🚀 ~ SignalProtocolIndexDBStore ~ loadPreKey ~ savedPreKey:", savedPreKey)
    if (isKeyPairType(savedPreKey)) {
      return {
        pubKey: savedPreKey.pubKey,
        privKey: savedPreKey.privKey,
      };
    } else if (typeof savedPreKey === "undefined") {
      return savedPreKey;
    }
    throw new Error("preKey is not of correct type");
  }

  async storePreKey(keyId: string | number, keyPair: KeyPairType<ArrayBuffer>) {
    return this.set("preKey:" + keyId, keyPair);
  }

  removePreKey: (keyId: string | number) => Promise<void> = async (
    keyId: string | number
  ) => {
    console.log('should remove keyId', keyId)
    return this.del("preKey:" + keyId);
  };
  storeSession: (encodedAddress: string, record: string) => Promise<void> =
    async (encodedAddress: string, record: string) => {
      return this.set("session:" + encodedAddress, record);
    };
  loadSession: (encodedAddress: string) => Promise<string | undefined> = async (
    encodedAddress: string
  ) => {
    console.log('loading session', encodedAddress)
    const session = this.get("session:" + encodedAddress);
    if (typeof session === "string") {
      return session;
    }
    return undefined;
  };

  getAllSignedPreKeys = async () => {
    const allKeys = await this._store.signalStoreItems.toCollection().keys();
    const signePreKeys = Promise.all(allKeys.filter((key) => (key as string).startsWith("signedPreKey:")).map(async (key) => this.loadSignedPreKey((key as string).replace("signedPreKey:", ""))));
    return signePreKeys;
  }

  loadSignedPreKey: (
    keyId: string | number
  ) => Promise<KeyPairType<ArrayBuffer> | undefined> = async (
    keyId: string | number
  ) => {
    console.log('keyId', keyId)
    const savedPreKey = await this.get("signedPreKey:" + keyId);

    console.log("🚀 ~ SignalProtocolIndexDBStore ~ savedPreKey:", savedPreKey)
    if (isKeyPairType(savedPreKey)) {
      return {
        pubKey: savedPreKey.pubKey,
        privKey: savedPreKey.privKey,
      };
    } else if (typeof savedPreKey === "undefined") {
      return savedPreKey;
    }
    throw new Error("preKey is not of correct type");
  };

  storeSignedPreKey: (
    keyId: string | number,
    keyPair: KeyPairType<ArrayBuffer>
  ) => Promise<void> = async (keyId: string | number, keyPair) => {
    return this.set("signedPreKey:" + keyId, keyPair);
  };
  removeSignedPreKey: (keyId: string | number) => Promise<void> = async (
    keyId: string | number
  ) => {
    return this.del("signedPreKey:" + keyId);
  };
}