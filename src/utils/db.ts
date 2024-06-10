import Dexie from "dexie";
import { encrypted } from "@pvermeer/dexie-encrypted-addon";

export interface Message {
  id?: string;
  timestamp: number;
  contactId: string;
  message: string;
  isFromMe?: boolean;
}

export interface KeyPairType<T = ArrayBuffer> {
  pubKey: T;
  privKey: T;
}
export interface PreKeyType<T = ArrayBuffer> {
  keyId: number;
  publicKey: T;
}

export interface Contact {
  id?: string;
  name: string;
}

type StoreValue =
  | string
  | number
  | KeyPairType
  | PreKeyType
  | ArrayBuffer
  | undefined;

export interface SignalStoreItem {
  key: string;
  value: StoreValue;
}

export default class AppDB extends Dexie {
  messages!: Dexie.Table<Message, string>;
  contacts!: Dexie.Table<Contact, string>;
  signalStoreItems!: Dexie.Table<SignalStoreItem, string>;

  private static dbName = "MessageStore";
  constructor(secret: string) {
    super(AppDB.dbName);
    encrypted(this, { secretKey: secret });
    this.version(3).stores({
      messages: "#id, $timestamp, contactId, $message, isFromMe",
      contacts: "#id, name",
      signalStoreItems: "key, $value",
    });
  }

  public static async appDBExists() {
    return Dexie.exists(AppDB.dbName);
  }

  public async getContactByName(name: string) {
    return this.contacts.get({ name });
  }

  public async addContact(name: string) {
    return this.contacts.add({
      name,
    });
  }

  async getOrCreateContact(name: string) {
    let contact = await this.getContactByName(name);
    if (!contact) {
      const contactId = await this.addContact(name);
      contact = { id: contactId, name };
    }
    return contact;
  }
}
