import Dexie from "dexie";
import { encrypted } from "@pvermeer/dexie-encrypted-addon";

export interface Message {
    id?: string;
    timestamp: number;
    contactId: string;
    message: string;
    isFromMe?: boolean;
}

export interface Contact {
    id?: string;
    name: string;
}



export default class AppDB extends Dexie {
    messages!: Dexie.Table<Message, string>;
    contacts!: Dexie.Table<Contact, string>;
    private static dbName = 'MessageStore';
    constructor(secret: string) {
        super(AppDB.dbName)
        encrypted(this, { secretKey: secret });
        this.version(2).stores({
            messages: '#id, $timestamp, contactId, $message, isFromMe',
            contacts: '#id, name'
        })
    }

    public static async appDBExists() {
        return Dexie.exists(AppDB.dbName)
    }
}
