export const createId = (): string => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizePhone = (value: string): string =>
    value.replace(/\D/g, "");

export const hasSameText = (left: string, right: string): boolean =>
    left.trim().toLowerCase() === right.trim().toLowerCase();
