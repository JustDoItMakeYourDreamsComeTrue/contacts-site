import type { Contact, ContactPayload, Group } from "../types";
import { createId, hasSameText, normalizePhone } from "../utils";
import { StorageService } from "./storage-service";

interface DeleteGroupResult {
    removedContacts: number;
}

export class ContactManager {
    private readonly contactsKey = "contacts-site-contacts";
    private readonly groupsKey = "contacts-site-groups";
    private contacts: Contact[] = [];
    private groups: Group[] = [];
    private readonly storage: StorageService;

    constructor(storage: StorageService) {
        this.storage = storage;
        this.contacts = this.storage.read<Contact[]>(this.contactsKey, []);
        this.groups = this.storage.read<Group[]>(this.groupsKey, []);
    }

    public getContacts(): Contact[] {
        return [...this.contacts];
    }

    public getGroups(): Group[] {
        return [...this.groups];
    }

    public getGroupById(groupId: string): Group | undefined {
        return this.groups.find((group) => group.id === groupId);
    }

    public addGroup(name: string): Group {
        const normalizedName = name.trim();
        if (!normalizedName) {
            throw new Error("Название группы не может быть пустым.");
        }

        const exists = this.groups.some((group) =>
            hasSameText(group.name, normalizedName),
        );
        if (exists) {
            throw new Error("Группа с таким названием уже существует.");
        }

        const group: Group = { id: createId(), name: normalizedName };
        this.groups.push(group);
        this.persistGroups();
        return group;
    }

    public updateGroup(groupId: string, name: string): Group {
        const normalizedName = name.trim();
        if (!normalizedName) {
            throw new Error("Название группы не может быть пустым.");
        }

        const group = this.groups.find((item) => item.id === groupId);
        if (!group) {
            throw new Error("Группа не найдена.");
        }

        const exists = this.groups.some(
            (item) =>
                item.id !== groupId && hasSameText(item.name, normalizedName),
        );

        if (exists) {
            throw new Error("Группа с таким названием уже существует.");
        }

        group.name = normalizedName;
        this.persistGroups();
        return group;
    }

    public deleteGroup(groupId: string): DeleteGroupResult {
        const group = this.groups.find((item) => item.id === groupId);
        if (!group) {
            throw new Error("Группа не найдена.");
        }

        this.groups = this.groups.filter((item) => item.id !== groupId);
        const beforeCount = this.contacts.length;
        this.contacts = this.contacts.filter(
            (contact) => contact.groupId !== groupId,
        );
        const removedContacts = beforeCount - this.contacts.length;

        this.persistGroups();
        this.persistContacts();

        return { removedContacts };
    }

    public replaceGroups(nextGroups: Group[]): DeleteGroupResult {
        const normalizedGroups = nextGroups.map((group) => ({
            id: group.id,
            name: group.name.trim(),
        }));

        if (normalizedGroups.some((group) => !group.name)) {
            throw new Error("Название группы не может быть пустым.");
        }

        const normalizedNames = normalizedGroups.map((group) =>
            group.name.toLowerCase(),
        );
        const hasDuplicates =
            new Set(normalizedNames).size !== normalizedNames.length;
        if (hasDuplicates) {
            throw new Error("Группа с таким названием уже существует.");
        }

        const allowedGroupIds = new Set(
            normalizedGroups.map((group) => group.id),
        );
        const beforeCount = this.contacts.length;

        // Если группа удалена, связанные контакты также удаляются по ТЗ.
        this.groups = normalizedGroups;
        this.contacts = this.contacts.filter(
            (contact) =>
                !!contact.groupId && allowedGroupIds.has(contact.groupId),
        );

        this.persistGroups();
        this.persistContacts();

        return {
            removedContacts: beforeCount - this.contacts.length,
        };
    }

    public addContact(payload: ContactPayload): Contact {
        this.ensureContactPayloadValid(payload, true);
        this.ensurePhoneUnique(payload.phone);

        const contact: Contact = {
            id: createId(),
            name: payload.name.trim(),
            phone: payload.phone.trim(),
            groupId: payload.groupId,
        };

        this.contacts.unshift(contact);
        this.persistContacts();
        return contact;
    }

    public updateContact(contactId: string, payload: ContactPayload): Contact {
        this.ensureContactPayloadValid(payload, false);
        this.ensurePhoneUnique(payload.phone, contactId);

        const contact = this.contacts.find((item) => item.id === contactId);
        if (!contact) {
            throw new Error("Контакт не найден.");
        }

        contact.name = payload.name.trim();
        contact.phone = payload.phone.trim();
        contact.groupId = payload.groupId;

        this.persistContacts();
        return contact;
    }

    public deleteContact(contactId: string): void {
        const nextContacts = this.contacts.filter(
            (item) => item.id !== contactId,
        );
        if (nextContacts.length === this.contacts.length) {
            throw new Error("Контакт не найден.");
        }

        this.contacts = nextContacts;
        this.persistContacts();
    }

    private ensureContactPayloadValid(
        payload: ContactPayload,
        requireGroup: boolean,
    ): void {
        if (!payload.name.trim()) {
            throw new Error("Имя контакта не может быть пустым.");
        }

        if (!payload.phone.trim()) {
            throw new Error("Номер телефона не может быть пустым.");
        }

        if (!payload.groupId) {
            if (!requireGroup) {
                return;
            }
            throw new Error("Выберите группу для контакта.");
        }

        const group = this.groups.find((item) => item.id === payload.groupId);
        if (!group) {
            throw new Error("Выберите существующую группу.");
        }
    }

    private ensurePhoneUnique(phone: string, ignoredContactId?: string): void {
        const normalizedPhone = normalizePhone(phone);
        const exists = this.contacts.some((contact) => {
            if (ignoredContactId && contact.id === ignoredContactId) {
                return false;
            }

            return normalizePhone(contact.phone) === normalizedPhone;
        });

        if (exists) {
            throw new Error("Контакт с таким номером телефона уже существует.");
        }
    }

    private persistContacts(): void {
        this.storage.write(this.contactsKey, this.contacts);
    }

    private persistGroups(): void {
        this.storage.write(this.groupsKey, this.groups);
    }
}
