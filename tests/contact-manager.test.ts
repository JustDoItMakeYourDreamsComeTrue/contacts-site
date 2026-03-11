import { describe, expect, it } from "vitest";
import { ContactManager } from "../src/services/contact-manager";
import { StorageService } from "../src/services/storage-service";

class MemoryStorage extends StorageService {
    private readonly data = new Map<string, string>();

    public override read<T>(key: string, fallbackValue: T): T {
        const value = this.data.get(key);
        if (!value) {
            return fallbackValue;
        }

        return JSON.parse(value) as T;
    }

    public override write<T>(key: string, value: T): void {
        this.data.set(key, JSON.stringify(value));
    }
}

describe("ContactManager", () => {
    it("запрещает дублирование названий групп", () => {
        const manager = new ContactManager(new MemoryStorage());
        manager.addGroup("Работа");

        expect(() => manager.addGroup("работа")).toThrowError(
            "Группа с таким названием уже существует.",
        );
    });

    it("запрещает дублирование номера телефона", () => {
        const manager = new ContactManager(new MemoryStorage());
        const group = manager.addGroup("Семья");

        manager.addContact({
            name: "Иван",
            phone: "+375 (29) 111-11-11",
            groupId: group.id,
        });

        expect(() =>
            manager.addContact({
                name: "Петр",
                phone: "+375 (29) 111-11-11",
                groupId: group.id,
            }),
        ).toThrowError("Контакт с таким номером телефона уже существует.");
    });

    it("не позволяет сохранить пустое название группы при пакетном сохранении", () => {
        const manager = new ContactManager(new MemoryStorage());
        const groups = manager.getGroups();

        expect(() =>
            manager.replaceGroups([
                {
                    id: groups[0].id,
                    name: "",
                },
            ]),
        ).toThrowError("Название группы не может быть пустым.");
    });

    it("не позволяет сохранить дублирующиеся названия групп при пакетном сохранении", () => {
        const manager = new ContactManager(new MemoryStorage());
        const first = manager.addGroup("Друзья");
        const second = manager.addGroup("Коллеги");

        expect(() =>
            manager.replaceGroups([
                { id: first.id, name: "Работа" },
                { id: second.id, name: "работа" },
            ]),
        ).toThrowError("Группа с таким названием уже существует.");
    });

    it("требует выбранную группу при создании контакта", () => {
        const manager = new ContactManager(new MemoryStorage());

        expect(() =>
            manager.addContact({
                name: "Иван",
                phone: "+375 (29) 000-00-00",
                groupId: null,
            }),
        ).toThrowError("Выберите группу для контакта.");
    });

    it("позволяет убрать группу при редактировании контакта", () => {
        const manager = new ContactManager(new MemoryStorage());
        const group = manager.addGroup("Семья");

        const contact = manager.addContact({
            name: "Иван",
            phone: "+375 (29) 000-00-01",
            groupId: group.id,
        });

        const updated = manager.updateContact(contact.id, {
            name: "Иван",
            phone: "+375 (29) 000-00-01",
            groupId: null,
        });

        expect(updated.groupId).toBeNull();
    });
});
