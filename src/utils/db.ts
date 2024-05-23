import Dexie from "dexie";
import { encrypted } from "@pvermeer/dexie-encrypted-addon";

interface Message {
    id?: number;
    timestamp: number;
    contactId: number;
    message: string;
    isFromMe?: boolean;
}

interface Contact {
    id?: number;
    name: string;
}



export default class AppDB extends Dexie {
    messages!: Dexie.Table<Message, number>;
    contacts!: Dexie.Table<Contact, number>;

    constructor(secret: string) {
        super('MessageStore')
        encrypted(this, { secretKey: secret });
        this.version(2).stores({
            messages: '#id, $timestamp, contactId, $message, isFromMe',
            contacts: '#id, name'
        })
    }
}
