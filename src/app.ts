import IMask from "imask";
import { ConfirmModal } from "./components/confirm-modal";
import { CustomDropdown } from "./components/custom-dropdown";
import { ToastManager } from "./components/toast-manager";
import { ContactManager } from "./services/contact-manager";
import { StorageService } from "./services/storage-service";
import type { Contact, Group } from "./types";
import { createId } from "./utils";

const GROUP_DELETE_CONFIRM_MESSAGE =
    "Вы уверены, что хотите удалить эту группу? Это приведет к удалению всех контактов, находящихся в этой группе.";

interface DraftGroup extends Group {
    isNew?: boolean;
}

export class ContactsApp {
    private readonly manager = new ContactManager(new StorageService());
    private readonly toast = new ToastManager(
        document.querySelector<HTMLElement>("[data-toast-container]")!,
    );
    private readonly confirmModal = new ConfirmModal(
        document.querySelector<HTMLElement>("[data-confirm-modal]")!,
    );
    private readonly contactModalElement = document.querySelector<HTMLElement>(
        "[data-contact-modal]",
    )!;
    private readonly groupsModalElement = document.querySelector<HTMLElement>(
        "[data-groups-modal]",
    )!;
    private readonly contactFormElement =
        document.querySelector<HTMLFormElement>("[data-contact-form]")!;
    private readonly contactsListElement = document.querySelector<HTMLElement>(
        "[data-contacts-list]",
    )!;
    private readonly emptyStateElement =
        document.querySelector<HTMLElement>("[data-empty-state]")!;
    private readonly groupsListElement =
        document.querySelector<HTMLElement>("[data-groups-list]")!;
    private readonly groupSaveButton =
        document.querySelector<HTMLButtonElement>("[data-group-save]")!;
    private readonly groupAddToggleButton =
        document.querySelector<HTMLButtonElement>("[data-group-add-toggle]")!;
    private readonly groupsTitleElement = document.querySelector<HTMLElement>(
        "[data-groups-title]",
    )!;
    private readonly addContactButtons = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
            "[data-open-contact-modal]",
        ),
    );
    private readonly openGroupsButton =
        document.querySelector<HTMLButtonElement>("[data-open-groups-modal]")!;
    private readonly dropdown = new CustomDropdown(
        document.querySelector<HTMLElement>("[data-dropdown]")!,
    );
    private readonly contactNameInputElement =
        this.contactFormElement.querySelector<HTMLInputElement>(
            '[name="name"]',
        )!;
    private readonly contactPhoneInputElement =
        this.contactFormElement.querySelector<HTMLInputElement>(
            '[name="phone"]',
        )!;
    private readonly nameErrorElement =
        this.contactFormElement.querySelector<HTMLElement>(
            "[data-error-name]",
        )!;
    private readonly phoneErrorElement =
        this.contactFormElement.querySelector<HTMLElement>(
            "[data-error-phone]",
        )!;
    private readonly groupErrorElement =
        this.contactFormElement.querySelector<HTMLElement>(
            "[data-error-group]",
        )!;
    private readonly dropdownRootElement =
        this.contactFormElement.querySelector<HTMLElement>("[data-dropdown]")!;

    private phoneMask: ReturnType<typeof IMask> | null = null;
    private editingContactId: string | null = null;
    private groupsDraft: DraftGroup[] = [];
    private groupsBeforeEdit: Group[] = [];
    private readonly collapsedGroupIds = new Set<string>();

    public init(): void {
        this.bindCommonEvents();
        this.render();
    }

    private bindCommonEvents(): void {
        this.addContactButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.openContactModal();
            });
        });

        this.openGroupsButton.addEventListener("click", () => {
            this.openGroupsModal();
        });

        this.contactModalElement.addEventListener("click", (event) => {
            if (event.target === this.contactModalElement) {
                this.closeContactModal();
            }
        });

        this.groupsModalElement.addEventListener("click", (event) => {
            if (event.target === this.groupsModalElement) {
                this.closeGroupsModal();
            }
        });

        document
            .querySelectorAll<HTMLElement>("[data-modal-close]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    this.closeContactModal();
                    this.closeGroupsModal();
                });
            });

        this.contactFormElement.addEventListener("submit", (event) => {
            event.preventDefault();
            this.submitContactForm();
        });

        this.groupAddToggleButton.addEventListener("click", () => {
            const createdGroup: DraftGroup = {
                id: createId(),
                name: "",
                isNew: true,
            };
            this.groupsDraft.push(createdGroup);
            this.renderGroupsDraft();
            this.focusDraftInput(createdGroup.id);
        });

        this.groupSaveButton.addEventListener("click", () => {
            this.saveGroupsDraft();
        });

        this.dropdown.bind("open", () => {
            document.body.classList.add("dropdown-open");
        });

        this.dropdown.bind("close", () => {
            document.body.classList.remove("dropdown-open");
        });

        this.contactNameInputElement.addEventListener("input", () => {
            this.clearFieldError("name");
        });

        this.contactPhoneInputElement.addEventListener("input", () => {
            this.clearFieldError("phone");
        });

        this.contactsListElement.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            const toggleButton = target.closest<HTMLButtonElement>(
                "[data-group-toggle]",
            );
            if (toggleButton) {
                const groupId = toggleButton.dataset.groupId;
                if (groupId) {
                    this.toggleGroup(groupId);
                }
                return;
            }

            const actionButton = target.closest<HTMLButtonElement>(
                "[data-contact-action]",
            );
            if (!actionButton) {
                return;
            }

            const contactId = actionButton.dataset.contactId;
            if (!contactId) {
                return;
            }

            if (actionButton.dataset.contactAction === "edit") {
                this.startContactEdit(contactId);
            }

            if (actionButton.dataset.contactAction === "delete") {
                this.deleteContact(contactId);
            }
        });

        this.groupsListElement.addEventListener("input", (event) => {
            const target = event.target as HTMLInputElement;
            if (!target.matches("[data-group-name-input]")) {
                return;
            }

            const groupId = target.dataset.groupId;
            if (!groupId) {
                return;
            }

            const group = this.groupsDraft.find((item) => item.id === groupId);
            if (!group) {
                return;
            }

            group.name = target.value;
        });

        this.groupsListElement.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const actionButton = target.closest<HTMLButtonElement>(
                "[data-group-action]",
            );
            if (!actionButton) {
                return;
            }

            const groupId = actionButton.dataset.groupId;
            if (!groupId) {
                return;
            }

            if (actionButton.dataset.groupAction === "delete") {
                this.confirmModal.open(GROUP_DELETE_CONFIRM_MESSAGE, () => {
                    this.groupsDraft = this.groupsDraft.filter(
                        (group) => group.id !== groupId,
                    );
                    this.renderGroupsDraft();
                });
            }
        });
    }

    private submitContactForm(): void {
        if (!this.validateContactForm()) {
            return;
        }

        const payload = {
            name: this.contactNameInputElement.value,
            phone: this.contactPhoneInputElement.value,
            groupId: this.dropdown.value || null,
        };

        try {
            if (this.editingContactId) {
                this.manager.updateContact(this.editingContactId, payload);
                this.toast.show("Контакт успешно изменен.", "success");
            } else {
                this.manager.addContact(payload);
                this.toast.show("Контакт успешно создан.", "success");
            }

            this.closeContactModal();
            this.render();
        } catch (error) {
            this.toast.show((error as Error).message, "error");
        }
    }

    private openGroupsModal(): void {
        this.groupsBeforeEdit = this.manager.getGroups();
        this.groupsDraft = this.groupsBeforeEdit.map((group) => ({
            ...group,
            isNew: false,
        }));

        this.groupsTitleElement.textContent = "Группы контактов";
        this.groupSaveButton.textContent = "Сохранить";
        this.groupsModalElement.classList.add("modal-overlay--visible");
        this.renderGroupsDraft();
    }

    private saveGroupsDraft(): void {
        const previousById = new Map(
            this.groupsBeforeEdit.map((group) => [group.id, group]),
        );

        try {
            const result = this.manager.replaceGroups(
                this.groupsDraft.map((group) => ({
                    id: group.id,
                    name: group.name,
                })),
            );

            const nextById = new Map(
                this.groupsDraft.map((group) => [group.id, group]),
            );
            const createdCount = this.groupsDraft.filter(
                (group) => !previousById.has(group.id),
            ).length;
            const deletedCount = this.groupsBeforeEdit.filter(
                (group) => !nextById.has(group.id),
            ).length;
            const renamedCount = this.groupsDraft.filter((group) => {
                const previous = previousById.get(group.id);
                return !!previous && previous.name.trim() !== group.name.trim();
            }).length;

            if (createdCount > 0) {
                this.toast.show(`Добавлено групп: ${createdCount}.`, "success");
            }
            if (renamedCount > 0) {
                this.toast.show(`Изменено групп: ${renamedCount}.`, "success");
            }
            if (deletedCount > 0) {
                this.toast.show(`Удалено групп: ${deletedCount}.`, "success");
            }
            if (result.removedContacts > 0) {
                this.toast.show(
                    `Удалено контактов: ${result.removedContacts}.`,
                    "success",
                );
            }
            if (
                createdCount === 0 &&
                renamedCount === 0 &&
                deletedCount === 0
            ) {
                this.toast.show("Изменений в группах нет.", "info");
            }

            this.closeGroupsModal();
            this.render();
        } catch (error) {
            this.toast.show((error as Error).message, "error");
        }
    }

    private renderGroupsDraft(): void {
        this.groupsListElement.innerHTML = this.groupsDraft
            .map(
                (group) => `
                    <li class="groups-drawer__item">
                        <input class="groups-drawer__name groups-drawer__name-input" type="text" data-group-name-input data-group-id="${group.id}" value="${this.escapeAttribute(group.name)}" placeholder="Введите название" />
                        <div class="groups-drawer__actions">
                            <button class="groups-drawer__action groups-drawer__action--delete" type="button" data-group-action="delete" data-group-id="${group.id}" aria-label="Удалить группу"></button>
                        </div>
                    </li>
                `,
            )
            .join("");
    }

    private focusDraftInput(groupId: string): void {
        const input = this.groupsListElement.querySelector<HTMLInputElement>(
            `[data-group-name-input][data-group-id="${groupId}"]`,
        );
        input?.focus();
    }

    private startContactEdit(contactId: string): void {
        const contact = this.manager
            .getContacts()
            .find((item) => item.id === contactId);
        if (!contact) {
            this.toast.show("Контакт не найден.", "error");
            return;
        }

        this.editingContactId = contact.id;
        this.openContactModal(contact);
    }

    private deleteContact(contactId: string): void {
        try {
            this.manager.deleteContact(contactId);
            this.toast.show("Контакт успешно удален.", "success");
            this.render();
        } catch (error) {
            this.toast.show((error as Error).message, "error");
        }
    }

    private openContactModal(contact?: Contact): void {
        this.contactModalElement.classList.add("modal-overlay--visible");
        this.clearContactFormErrors();

        const titleElement =
            this.contactModalElement.querySelector<HTMLElement>(
                "[data-contact-title]",
            )!;
        titleElement.textContent = contact
            ? "Редактировать контакт"
            : "Добавление контакта";

        const submitElement =
            this.contactFormElement.querySelector<HTMLButtonElement>(
                '[type="submit"]',
            )!;
        submitElement.textContent = "Сохранить";

        this.contactNameInputElement.value = contact?.name ?? "";
        this.contactPhoneInputElement.value = contact?.phone ?? "";

        if (!contact) {
            this.editingContactId = null;
        }

        if (!this.phoneMask) {
            this.phoneMask = IMask(this.contactPhoneInputElement, {
                mask: "+{375} (00) 000-00-00",
            });
        }

        this.phoneMask.value = this.contactPhoneInputElement.value;

        const groups = this.manager
            .getGroups()
            .map((group) => ({ id: group.id, name: group.name }));
        this.dropdown.dataItems = groups;

        if (contact) {
            if (contact.groupId) {
                this.dropdown.selectById(contact.groupId, false);
            } else {
                this.dropdown.clearSelection(false);
            }
        } else {
            this.dropdown.clearSelection(false);
        }
    }

    private closeContactModal(): void {
        this.contactModalElement.classList.remove("modal-overlay--visible");
        this.contactFormElement.reset();
        this.clearContactFormErrors();
        this.dropdown.clearSelection(false);
        this.dropdown.close();
        this.editingContactId = null;
    }

    private closeGroupsModal(): void {
        this.groupsModalElement.classList.remove("modal-overlay--visible");
        this.groupsDraft = [];
        this.groupsBeforeEdit = [];
    }

    private render(): void {
        const groups = this.manager.getGroups();
        const contacts = this.manager.getContacts();

        const ungroupedContacts = contacts.filter(
            (contact) =>
                !contact.groupId ||
                !groups.some((group) => group.id === contact.groupId),
        );

        this.dropdown.dataItems = groups.map((group) => ({
            id: group.id,
            name: group.name,
        }));

        // Рендерим группы с их контактами
        const groupsHtml = groups
            .map((group) => {
                const groupContacts = contacts.filter(
                    (contact) => contact.groupId === group.id,
                );

                // Не рендерим группы без контактов
                if (groupContacts.length === 0) {
                    return "";
                }

                const isCollapsed = this.collapsedGroupIds.has(group.id);

                return `
                    <li class="contacts__group group-card ${isCollapsed ? "group-card--collapsed" : ""}">
                        <button class="group-card__header" type="button" data-group-toggle data-group-id="${group.id}">
                            <span class="group-card__title">${group.name}</span>
                            <span class="group-card__toggle" aria-hidden="true">⌄</span>
                        </button>
                        <ul class="group-card__list">
                            ${groupContacts
                                .map(
                                    (contact) => `
                                <li class="group-card__contact-row" data-contact-id="${contact.id}">
                                    <p class="group-card__contact-name">${contact.name}</p>
                                    <div class="group-card__right-side">
                                        <p class="group-card__contact-phone">${contact.phone}</p>
                                        <div class="group-card__actions">
                                            <button class="group-card__action group-card__action--edit" type="button" data-contact-action="edit" data-contact-id="${contact.id}" aria-label="Изменить контакт"></button>
                                            <button class="group-card__action group-card__action--delete" type="button" data-contact-action="delete" data-contact-id="${contact.id}" aria-label="Удалить контакт"></button>
                                        </div>
                                    </div>
                                </li>
                            `,
                                )
                                .join("")}
                        </ul>
                    </li>
                `;
            })
            .join("");

        // Рендерим контакты без группы отдельно
        const ungroupedHtml =
            ungroupedContacts.length > 0
                ? `
                    <li class="contacts__ungrouped">
                        <h2 class="contacts__ungrouped-title">Без группы</h2>
                        <ul class="contacts__ungrouped-list">
                            ${ungroupedContacts
                                .map(
                                    (contact) => `
                                <li class="contacts__ungrouped-contact" data-contact-id="${contact.id}">
                                    <p class="contacts__ungrouped-contact-name">${contact.name}</p>
                                    <div class="contacts__ungrouped-right-side">
                                        <p class="contacts__ungrouped-contact-phone">${contact.phone}</p>
                                        <div class="contacts__ungrouped-actions">
                                            <button class="contacts__ungrouped-action contacts__ungrouped-action--edit" type="button" data-contact-action="edit" data-contact-id="${contact.id}" aria-label="Изменить контакт"></button>
                                            <button class="contacts__ungrouped-action contacts__ungrouped-action--delete" type="button" data-contact-action="delete" data-contact-id="${contact.id}" aria-label="Удалить контакт"></button>
                                        </div>
                                    </div>
                                </li>
                            `,
                                )
                                .join("")}
                        </ul>
                    </li>
                `
                : "";

        this.contactsListElement.innerHTML = groupsHtml + ungroupedHtml;

        this.emptyStateElement.classList.toggle(
            "contacts__empty--hidden",
            contacts.length > 0,
        );
    }

    private toggleGroup(groupId: string): void {
        if (this.collapsedGroupIds.has(groupId)) {
            this.collapsedGroupIds.delete(groupId);
        } else {
            this.collapsedGroupIds.add(groupId);
        }

        this.render();
    }

    private validateContactForm(): boolean {
        this.clearContactFormErrors();

        let isValid = true;

        if (!this.contactNameInputElement.value.trim()) {
            this.setFieldError("name", "Поле является обязательным");
            isValid = false;
        }

        const phoneDigits = this.contactPhoneInputElement.value.replace(
            /\D/g,
            "",
        );
        if (!phoneDigits) {
            this.setFieldError("phone", "Поле является обязательным");
            isValid = false;
        } else if (phoneDigits.length < 12) {
            this.setFieldError("phone", "Введите номер полностью");
            isValid = false;
        }

        if (!this.dropdown.value && !this.editingContactId) {
            this.setFieldError("group", "Поле является обязательным");
            isValid = false;
        }

        return isValid;
    }

    private clearContactFormErrors(): void {
        this.clearFieldError("name");
        this.clearFieldError("phone");
        this.clearFieldError("group");
    }

    private setFieldError(
        field: "name" | "phone" | "group",
        message: string,
    ): void {
        if (field === "name") {
            this.contactNameInputElement.classList.add("form__input--invalid");
            this.nameErrorElement.textContent = message;
            return;
        }

        if (field === "phone") {
            this.contactPhoneInputElement.classList.add("form__input--invalid");
            this.phoneErrorElement.textContent = message;
            return;
        }

        this.dropdownRootElement.classList.add("dropdown--invalid");
        this.groupErrorElement.textContent = message;
    }

    private clearFieldError(field: "name" | "phone" | "group"): void {
        if (field === "name") {
            this.contactNameInputElement.classList.remove(
                "form__input--invalid",
            );
            this.nameErrorElement.textContent = "";
            return;
        }

        if (field === "phone") {
            this.contactPhoneInputElement.classList.remove(
                "form__input--invalid",
            );
            this.phoneErrorElement.textContent = "";
            return;
        }

        this.dropdownRootElement.classList.remove("dropdown--invalid");
        this.groupErrorElement.textContent = "";
    }

    private escapeAttribute(value: string): string {
        // Экранируем спецсимволы, чтобы безопасно вставлять значение в HTML.
        return value
            .replaceAll("&", "&amp;")
            .replaceAll('"', "&quot;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }
}
