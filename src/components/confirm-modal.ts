export class ConfirmModal {
    private readonly rootElement: HTMLElement;
    private readonly messageElement: HTMLElement;
    private readonly cancelButton: HTMLButtonElement;
    private readonly confirmButton: HTMLButtonElement;
    private onConfirmAction: (() => void) | null = null;

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
        this.messageElement = rootElement.querySelector<HTMLElement>(
            "[data-confirm-message]",
        )!;
        this.cancelButton = rootElement.querySelector<HTMLButtonElement>(
            "[data-confirm-cancel]",
        )!;
        this.confirmButton = rootElement.querySelector<HTMLButtonElement>(
            "[data-confirm-submit]",
        )!;

        this.cancelButton.addEventListener("click", () => this.close());
        this.rootElement.addEventListener("click", (event) => {
            if (event.target === this.rootElement) {
                this.close();
            }
        });

        this.confirmButton.addEventListener("click", () => {
            this.onConfirmAction?.();
            this.close();
        });
    }

    public open(message: string, onConfirmAction: () => void): void {
        this.onConfirmAction = onConfirmAction;
        this.messageElement.textContent = message;
        this.rootElement.classList.add("modal-overlay--visible");
    }

    public close(): void {
        this.onConfirmAction = null;
        this.rootElement.classList.remove("modal-overlay--visible");
    }
}
