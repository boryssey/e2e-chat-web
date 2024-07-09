//authContext
import {
  Direction,
  FingerprintGenerator,
  KeyHelper,
  KeyPairType,
  PreKeyType,
  SignalProtocolAddress,
  SignedPublicPreKeyType,
  StorageType,
} from '@privacyresearch/libsignal-protocol-typescript'
import AppDB, { type StoreValueSerialized } from './db'
import { SessionRecord } from '@privacyresearch/libsignal-protocol-typescript/lib/session-record'

/*
    Examples are: 
    https://github.dev/privacyresearchgroup/libsignal-typescript-demo/blob/master/simple/src/storage-type.ts#L5
    
    or 

    https://github.com/signalapp/Signal-Desktop/blob/ce83195170047aae754c225a89d75de56bd953e0/ts/sql/Interface.ts#L71

*/

export function arrayBufferToString(b: ArrayBuffer): string {
  return uint8ArrayToString(new Uint8Array(b))
}

export function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  )
}

export function uint8ArrayToString(arr: Uint8Array): string {
  const end = arr.length
  let begin = 0
  if (begin === end) return ''
  let chars: number[] = []
  const parts: string[] = []
  while (begin < end) {
    chars.push(arr[begin++])
    if (chars.length >= 1024) {
      parts.push(String.fromCharCode(...chars))
      chars = []
    }
  }
  return parts.join('') + String.fromCharCode(...chars)
}

function isArrayBuffer(thing: StoreValue): boolean {
  const t = typeof thing
  return (
    !!thing &&
    t !== 'string' &&
    t !== 'number' &&
    'byteLength' in (thing as ArrayBuffer)
  )
}

export function isKeyPairType(kp: StoreValue): kp is KeyPairType {
  // return !!(kp?.privKey && kp?.pubKey);
  return !!(kp && typeof kp === 'object' && 'privKey' in kp && 'pubKey' in kp)
}

type StoreValue =
  | string
  | number
  | KeyPairType
  | PreKeyType
  | ArrayBuffer
  | undefined

const serializeStoreValue = (value: StoreValue): StoreValueSerialized => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (isKeyPairType(value)) {
    return {
      pubKey: Buffer.from(value.pubKey).toJSON(),
      privKey: Buffer.from(value.privKey).toJSON(),
    }
  }
  if (value instanceof ArrayBuffer) {
    return Buffer.from(value).toJSON()
  }
  if (value && 'keyId' in value && 'publicKey' in value) {
    return {
      keyId: value.keyId,
      publicKey: Buffer.from(value.publicKey).toJSON(),
    }
  }
  return undefined
}

const deserializeStoreValue = (value: StoreValueSerialized): StoreValue => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (value && 'pubKey' in value && 'privKey' in value) {
    return {
      pubKey: Buffer.from(value.pubKey.data).buffer,
      privKey: Buffer.from(value.privKey.data).buffer,
    }
  }
  if (value && 'keyId' in value && 'publicKey' in value) {
    return {
      keyId: value.keyId,
      publicKey: Buffer.from(value.publicKey.data).buffer,
    }
  }
  if (value?.data) {
    return Buffer.from(value.data).buffer
  }
  return undefined
}

export class SignalProtocolIndexDBStore implements StorageType {
  private _store
  static dbName = 'signal-store'

  constructor(appDB: AppDB) {
    this._store = appDB
  }

  public static async storeExists() {
    return (await window.indexedDB.databases())
      .map((db) => db.name)
      .includes(SignalProtocolIndexDBStore.dbName)
  }

  private async get(key: string) {
    return deserializeStoreValue(
      (await this._store.signalStoreItems.get(key))?.value
    )
    // return get(key, this._store);
  }

  private async set(key: string, value: StoreValue) {
    await this._store.signalStoreItems.put({
      key,
      value: serializeStoreValue(value),
    })
    // return set(key, value, this._store);
  }

  private async del(key: string) {
    return this._store.signalStoreItems.delete(key)
  }

  async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
    const keyPair = await this.get('identityKey')

    if (isKeyPairType(keyPair)) {
      return keyPair
    }
    return undefined
  }

  async getLocalRegistrationId() {
    const localRegistrationId = await this.get('registrationId')
    if (localRegistrationId && !isNaN(+localRegistrationId)) {
      return Number(localRegistrationId)
    }
    return undefined
  }

  async saveLocalRegistrationId(id: string) {
    return this.set('registrationId', id)
  }

  async saveIdentityKeyPair(keyPair: KeyPairType) {
    return this.set('identityKey', keyPair)
  }

  async getOneTimePreKeys() {
    const allKeys = (await this._store.signalStoreItems
      .toCollection()
      .keys()) as string[]
    const oneTimeKeys = Promise.all(
      allKeys
        .filter((key) => key.startsWith('preKey:'))
        .map(async (key) => this.get(key))
    )
    return oneTimeKeys
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer | undefined,
    _direction: Direction
  ) {
    if (!identifier || !identityKey) {
      throw new Error('identifier or identityKey is missing')
    }

    const trusted = await this.get('identifierKey:' + identifier)

    if (!trusted) {
      // no previous conversation with this identity

      return true
    }

    // check if the identity key is the same
    const result = Promise.resolve(
      arrayBufferToString(identityKey) ===
        arrayBufferToString(trusted as ArrayBuffer)
    )

    return result

    // return true;
  }

  async deleteIdentity(identifier: string) {
    return this.del('identifierKey:' + identifier)
  }

  async saveIdentity(
    encodedAddress: string,
    publicKey: ArrayBuffer,
    _nonblockingApproval?: boolean | undefined
  ) {
    const address = SignalProtocolAddress.fromString(encodedAddress)
    const existing = await this.get('identifierKey:' + address.name)
    await this.set('identifierKey:' + address.name, publicKey)

    if (existing && !isArrayBuffer(existing)) {
      throw new Error('public identity key is not of correct type')
    }

    if (
      existing &&
      arrayBufferToString(publicKey) !==
        arrayBufferToString(existing as ArrayBuffer)
    ) {
      return true
    }

    return false
  }

  async loadPreKey(encodedAddress: string | number) {
    const savedPreKey = await this.get('preKey:' + encodedAddress)
    if (isKeyPairType(savedPreKey)) {
      return {
        pubKey: savedPreKey.pubKey,
        privKey: savedPreKey.privKey,
      }
    } else if (typeof savedPreKey === 'undefined') {
      return savedPreKey
    }
    throw new Error('preKey is not of correct type')
  }

  async storePreKey(keyId: string | number, keyPair: KeyPairType) {
    return this.set('preKey:' + keyId, keyPair)
  }

  removePreKey: (keyId: string | number) => Promise<void> = async (
    keyId: string | number
  ) => {
    return this.del('preKey:' + keyId)
  }
  async storeSession(encodedAddress: string, record: string) {
    return this.set('session:' + encodedAddress, record)
  }

  async loadSession(encodedAddress: string) {
    const session = await this.get('session:' + encodedAddress)
    if (typeof session === 'string') {
      return session
    }
    return undefined
  }

  async getAllSignedPreKeys() {
    const allKeys = await this._store.signalStoreItems.toCollection().keys()
    const signePreKeys = Promise.all(
      allKeys
        .filter((key) => (key as string).startsWith('signedPreKey:'))
        .map(async (key) =>
          this.loadSignedPreKey((key as string).replace('signedPreKey:', ''))
        )
    )
    return signePreKeys
  }

  async loadSignedPreKey(keyId: string | number) {
    const savedPreKey = await this.get('signedPreKey:' + keyId)

    if (isKeyPairType(savedPreKey)) {
      return {
        pubKey: savedPreKey.pubKey,
        privKey: savedPreKey.privKey,
      }
    } else if (typeof savedPreKey === 'undefined') {
      return savedPreKey
    }
    throw new Error('preKey is not of correct type')
  }

  async storeSignedPreKey(keyId: string | number, keyPair: KeyPairType) {
    return this.set('signedPreKey:' + keyId, keyPair)
  }
  async removeSignedPreKey(keyId: string | number) {
    return this.del('signedPreKey:' + keyId)
  }

  async createID() {
    const registrationId = KeyHelper.generateRegistrationId()
    await this.saveLocalRegistrationId(registrationId.toString())

    const identityKeyPair = await KeyHelper.generateIdentityKeyPair()
    await this.saveIdentityKeyPair(identityKeyPair)
    const preKeys = await Promise.all(
      Array.from({ length: 100 }, async (_) => {
        const baseKeyId = Math.floor(10000 * Math.random())
        const preKey = await KeyHelper.generatePreKey(baseKeyId)
        await this.storePreKey(`${baseKeyId}`, preKey.keyPair)
        return preKey
      })
    )
    const signedPreKeyId = Math.floor(10000 * Math.random())
    const signedPreKey = await KeyHelper.generateSignedPreKey(
      identityKeyPair,
      signedPreKeyId
    )
    const publicSignedPreKey: SignedPublicPreKeyType = {
      keyId: signedPreKeyId,
      publicKey: signedPreKey.keyPair.pubKey,
      signature: signedPreKey.signature,
    }

    const preKeyBundle = {
      registrationId,
      identityPubKey: identityKeyPair.pubKey,
      signedPreKey: publicSignedPreKey,
      oneTimePreKeys: preKeys.map((preKey) => ({
        keyId: preKey.keyId,
        publicKey: preKey.keyPair.pubKey,
      })),
    }

    return preKeyBundle
  }

  async getID() {
    const registrationId = await this.getLocalRegistrationId()
    const identityKeyPair = await this.getIdentityKeyPair()
    const preKeys = await this.getOneTimePreKeys()
    const signedPreKeys = await this.getAllSignedPreKeys()
    if (!registrationId || !identityKeyPair || !signedPreKeys.length) {
      return null
    }

    return {
      registrationId,
      identityKeyPair,
      preKeys,
      signedPreKeys,
    }
  }

  async getRemoteIdentityKeyByUsername(remoteUsername: string) {
    const recipientAddress = new SignalProtocolAddress(remoteUsername, 1)
    const sessionWithRecipient = await this.loadSession(
      recipientAddress.toString()
    )
    if (!sessionWithRecipient) {
      console.warn('no session with recipient')
      return null
    }
    const sessionRecord = SessionRecord.deserialize(sessionWithRecipient)
    const activeSession = sessionRecord.getOpenSession()
    if (!activeSession) {
      console.warn('no active session for user:', remoteUsername)
      return null
    }
    return activeSession.indexInfo.remoteIdentityKey
  }

  async createFingerprintFor(localUsername: string, remoteUsername: string) {
    const remoteIdentityKey =
      await this.getRemoteIdentityKeyByUsername(remoteUsername)

    if (!remoteIdentityKey) {
      console.warn('no remote identity key')
      return null
    }

    const currentUserIdentifier = await this.getIdentityKeyPair()
    if (!currentUserIdentifier) {
      console.warn('no current user identifier')
      return null
    }

    const fingerprintGenerator = new FingerprintGenerator(1024)
    const fingerPrint = await fingerprintGenerator.createFor(
      localUsername,
      currentUserIdentifier.pubKey,
      remoteUsername,
      remoteIdentityKey
    )
    return fingerPrint
  }
}
