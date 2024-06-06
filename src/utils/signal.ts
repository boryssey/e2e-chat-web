import {
  KeyHelper,
  PreKeyType,
  SignedPublicPreKeyType,
} from "@privacyresearch/libsignal-protocol-typescript";
import { SignalProtocolIndexDBStore } from "./EncryptedSignalStore";
import { socket } from "@/app/socket";

export const createID = async (
  name: string,
  store: SignalProtocolIndexDBStore
) => {
  const registrationId = KeyHelper.generateRegistrationId();
  // Store registrationId somewhere durable and safe... Or do this.
  store.saveLocalRegistrationId(registrationId.toString()   );

  const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
  // Store identityKeyPair somewhere durable and safe... Or do this.
  store.saveIdentityKeyPair(identityKeyPair);

  const baseKeyId = Math.floor(10000 * Math.random());
  const preKey = await KeyHelper.generatePreKey(baseKeyId);
  store.storePreKey(`${baseKeyId}`, preKey.keyPair);

  const signedPreKeyId = Math.floor(10000 * Math.random());
  const signedPreKey = await KeyHelper.generateSignedPreKey(
    identityKeyPair,
    signedPreKeyId
  );
  store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);
  const publicSignedPreKey: SignedPublicPreKeyType = {
    keyId: signedPreKeyId,
    publicKey: signedPreKey.keyPair.pubKey,
    signature: signedPreKey.signature,
  };

  // Now we register this with the server so all users can see them
  const publicPreKey: PreKeyType = {
    keyId: preKey.keyId,
    publicKey: preKey.keyPair.pubKey,
  };

  const preKeyBundle = {
    registrationId,
    identityPubKey: identityKeyPair.pubKey,
    signedPreKey: publicSignedPreKey,
    oneTimePreKeys: [publicPreKey],
  };
  console.log('created preKeyBundle', preKeyBundle)
  /*
  console.log('created preKeyBundle', preKeyBundle)
  const body = JSON.stringify(preKeyBundle)
  const response = await fetch('http://localhost:3000/user/keyBundle', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body,
  })

  */
  socket.emit("keyBundle:save", preKeyBundle);
  return preKeyBundle;
};
export const stringToArrayBuffer = (str: string) => {
    return new TextEncoder().encode(str);
}
export const arrayBufferToString = (buf: ArrayBuffer) => {
    return new TextDecoder().decode(buf);
}



export const getID = async (
  store: SignalProtocolIndexDBStore
) => {
    console.log(store)
  const registrationId = await store.getLocalRegistrationId();
  const identityKeyPair = await store.getIdentityKeyPair();
  const preKeys = await store.getOneTimePreKeys();
  const signedPreKeys = await store.getAllSignedPreKeys();
  if (
    !registrationId ||
    !identityKeyPair ||
    !preKeys.length ||
    !signedPreKeys.length
  ) {
    return null;
  }
 console.log(identityKeyPair.privKey.toString(), 'identityKeyPair.privKey.toString()')

  return {
    registrationId,
    identityKeyPair,
    preKeys,
    signedPreKeys,
  };
};
