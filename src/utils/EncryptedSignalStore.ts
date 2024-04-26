//authContext
import {
  Direction,
  KeyPairType,
  PreKeyType,
  SignalProtocolAddress,
  StorageType,
} from "@privacyresearch/libsignal-protocol-typescript";
import React, { createContext } from "react";
import { Store } from "secure-webstore";

/*
    Examples are: 
    https://github.dev/privacyresearchgroup/libsignal-typescript-demo/blob/master/simple/src/storage-type.ts#L5
    
    or 

    https://github.com/signalapp/Signal-Desktop/blob/ce83195170047aae754c225a89d75de56bd953e0/ts/sql/Interface.ts#L71

*/

const defaultState = {};

export function arrayBufferToString(b: ArrayBuffer): string {
  return uint8ArrayToString(new Uint8Array(b));
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

  constructor() {
    this._store = new Store("some-store-name", "super-secure-passphrase");
  }

  async init() {
    return this._store.init();
  }

  async getIdentityKeyPair() {
    return this._store.get("identityKey");
  }

  async getLocalRegistrationId() {
    return this._store.get("registrationId");
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    _direction: Direction
  ) {
    if (!identifier || !identityKey) {
      throw new Error("identifier or identityKey is missing");
    }

    const trusted = await this._store.get("identifierKey:" + identifier);

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
    const existing = await this._store.get("identifierKey:" + address.name);
    this._store.set("identifierKey:" + address.name, publicKey);

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
  //   loadPreKey: (
  //     encodedAddress: string | number
  //   ) => Promise<KeyPairType<ArrayBuffer> | undefined>;

  async loadPreKey(encodedAddress: string | number) {
    const savedPreKey = this._store.get("preKey:" + encodedAddress);
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
    this._store.set("preKey:" + keyId, keyPair);
  }

  removePreKey: (keyId: string | number) => Promise<void> = async (
    keyId: string | number
  ) => {
    this._store.del("preKey:" + keyId);
  };
  storeSession: (encodedAddress: string, record: string) => Promise<void> =
    async (encodedAddress: string, record: string) => {
      this._store.set("session:" + encodedAddress, record);
    };
  loadSession: (encodedAddress: string) => Promise<string | undefined> = async (
    encodedAddress: string
  ) => {
    return this._store.get("session:" + encodedAddress);
  };

  loadSignedPreKey: (
    keyId: string | number
  ) => Promise<KeyPairType<ArrayBuffer> | undefined> = async (
    keyId: string | number
  ) => {
    const savedPreKey = this._store.get("signedPreKey:" + keyId);
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
    this._store.set("signedPreKey:" + keyId, keyPair);
  };
  removeSignedPreKey: (keyId: string | number) => Promise<void> = async (
    keyId: string | number
  ) => {
    this._store.del("signedPreKey:" + keyId);
  };
}
