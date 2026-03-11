interface DropdownItem {
    id: string;
    name: string;
}

type DropdownEventName = "change" | "open" | "close";

type DropdownHandler = (item: DropdownItem | null) => void;
const DROPDOWN_PLACEHOLDER = "Выберите группу";

export class CustomDropdown {
    // Храним подписчиков по имени события, чтобы внешний код
    // мог реагировать на изменение значения и состояние списка.
    private readonly handlers = new Map<
        DropdownEventName,
        Set<DropdownHandler>
    >();
    private readonly triggerElement: HTMLButtonElement;
    private readonly listElement: HTMLUListElement;
    private readonly valueElement: HTMLSpanElement;
    private readonly rootElement: HTMLElement;
    private selectedItem: DropdownItem | null = null;
    private items: DropdownItem[] = [];
    private isOpened = false;

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
        this.triggerElement = rootElement.querySelector<HTMLButtonElement>(
            "[data-dropdown-trigger]",
        )!;
        this.listElement = rootElement.querySelector<HTMLUListElement>(
            "[data-dropdown-list]",
        )!;
        this.valueElement = rootElement.querySelector<HTMLSpanElement>(
            "[data-dropdown-value]",
        )!;

        this.triggerElement.addEventListener("click", () => {
            if (this.isOpened) {
                this.close();
            } else {
                this.open();
            }
        });

        document.addEventListener("click", (event) => {
            if (!this.rootElement.contains(event.target as Node)) {
                this.close();
            }
        });
    }

    public bind(eventName: DropdownEventName, handler: DropdownHandler): void {
        const current =
            this.handlers.get(eventName) ?? new Set<DropdownHandler>();
        current.add(handler);
        this.handlers.set(eventName, current);
    }

    public get dataItems(): DropdownItem[] {
        return [...this.items];
    }

    public set dataItems(nextItems: DropdownItem[]) {
        this.items = [...nextItems];
        this.renderItems();

        if (this.selectedItem) {
            const stillExists = this.items.find(
                (item) => item.id === this.selectedItem?.id,
            );
            if (!stillExists) {
                this.clearSelection(false);
            }
        }

        if (this.items.length === 0) {
            this.clearSelection(false);
        }
    }

    public get value(): string {
        return this.selectedItem?.id ?? "";
    }

    public selectById(itemId: string, emitEvent = true): void {
        const item = this.items.find(
            (currentItem) => currentItem.id === itemId,
        );
        if (!item) {
            return;
        }

        this.selectedItem = item;
        this.valueElement.textContent = item.name;

        const buttons = this.listElement.querySelectorAll<HTMLButtonElement>(
            ".dropdown__item-button",
        );
        buttons.forEach((button) => {
            const isActive = button.dataset.itemId === item.id;
            button.classList.toggle("dropdown__item-button--active", isActive);
        });

        if (emitEvent) {
            this.emit("change", item);
        }
    }

    public clearSelection(emitEvent = true): void {
        this.selectedItem = null;
        this.valueElement.textContent = DROPDOWN_PLACEHOLDER;

        const buttons = this.listElement.querySelectorAll<HTMLButtonElement>(
            ".dropdown__item-button",
        );
        buttons.forEach((button) => {
            button.classList.remove("dropdown__item-button--active");
        });

        if (emitEvent) {
            this.emit("change", null);
        }
    }

    public open(): void {
        if (this.isOpened) {
            return;
        }

        this.isOpened = true;
        this.rootElement.classList.add("dropdown--open");
        this.emit("open", this.selectedItem);
    }

    public close(): void {
        if (!this.isOpened) {
            return;
        }

        this.isOpened = false;
        this.rootElement.classList.remove("dropdown--open");
        this.emit("close", this.selectedItem);
    }

    private renderItems(): void {
        this.listElement.innerHTML = this.items
            .map(
                (item) => `
          <li class="dropdown__item">
            <button class="dropdown__item-button" type="button" data-item-id="${item.id}">
              ${item.name}
            </button>
          </li>
        `,
            )
            .join("");

        const buttons = this.listElement.querySelectorAll<HTMLButtonElement>(
            ".dropdown__item-button",
        );
        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const selectedId = button.dataset.itemId;
                if (!selectedId) {
                    return;
                }

                this.selectById(selectedId);
                this.close();
            });
        });
    }

    private emit(
        eventName: DropdownEventName,
        item: DropdownItem | null,
    ): void {
        // Уведомляем подписчиков вручную, имитируя простой EventEmitter.
        const eventHandlers = this.handlers.get(eventName);
        if (!eventHandlers) {
            return;
        }

        eventHandlers.forEach((handler) => handler(item));
    }
}
