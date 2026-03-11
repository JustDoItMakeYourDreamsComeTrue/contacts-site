export class StorageService {
    public read<T>(key: string, fallbackValue: T): T {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) {
            return fallbackValue;
        }

        try {
            return JSON.parse(rawValue) as T;
        } catch {
            return fallbackValue;
        }
    }

    public write<T>(key: string, value: T): void {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
