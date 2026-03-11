import type { ToastType } from "../types";

export class ToastManager {
    private readonly containerElement: HTMLElement;

    constructor(containerElement: HTMLElement) {
        this.containerElement = containerElement;
    }

    public show(message: string, type: ToastType = "info"): void {
        const toastElement = document.createElement("div");
        toastElement.className = `toast toast--${type}`;
        toastElement.textContent = message;

        this.containerElement.appendChild(toastElement);

        requestAnimationFrame(() => {
            toastElement.classList.add("toast--visible");
        });

        window.setTimeout(() => {
            toastElement.classList.remove("toast--visible");
            window.setTimeout(() => {
                toastElement.remove();
            }, 200);
        }, 2800);
    }
}
