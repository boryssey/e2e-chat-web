import Dexie from 'dexie'
import { encrypted } from '@pvermeer/dexie-encrypted-addon'

export interface Message {
  id?: string
  timestamp: number
  contactId: string
  message: string
  isFromMe?: boolean
  type?: 'text' | 'system'
}

export interface KeyPairType<T = ArrayBuffer> {
  pubKey: T
  privKey: T
}
export interface PreKeyType<T = ArrayBuffer> {
  keyId: number
  publicKey: T
}

export interface Contact {
  id?: string
  name: string
}

interface ArrayBufferSerialized {
  data: number[]
  type: 'Buffer'
}

export type StoreValueSerialized =
  | string
  | number
  | KeyPairType<ArrayBufferSerialized>
  | PreKeyType<ArrayBufferSerialized>
  | ArrayBufferSerialized
  | undefined

export interface SignalStoreItem {
  key: string
  value: StoreValueSerialized
}

export default class AppDB extends Dexie {
  messages!: Dexie.Table<Message, string>
  contacts!: Dexie.Table<Contact, string>
  signalStoreItems!: Dexie.Table<SignalStoreItem, string>

  static dbName = 'MessageStore'
  constructor(secret: string, userId: string | number) {
    super(`${AppDB.dbName}-${userId}`)
    encrypted(this, { secretKey: secret })
    this.version(4).stores({
      messages: '#id, $timestamp, type, contactId, $message, isFromMe',
      contacts: '#id, name',
      signalStoreItems: 'key, $value',
    })
  }

  public static async appDBExists(userId: string | number) {
    return Dexie.exists(`${AppDB.dbName}-${userId}`)
  }

  public async getContactByName(name: string) {
    return this.contacts.get({ name })
  }

  public async addContact(name: string) {
    return this.contacts.add({
      name,
    })
  }

  async getOrCreateContact(name: string) {
    let contact = await this.getContactByName(name)
    if (!contact) {
      const contactId = await this.addContact(name)
      contact = { id: contactId, name }
    }
    return contact
  }
}
