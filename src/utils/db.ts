import Dexie from "dexie";
import { encrypted } from "@pvermeer/dexie-encrypted-addon";

interface Message {
    id?: number;
    timestamp: number;
    senderId: number;
    message: string;
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
        this.version(1).stores({
            messages: '#id, $timestamp, senderId, $message',
            contacts: '#id, name'
        })
    }
}
