export class AssetManager {
  private cache = new Map<string, unknown>();

  load(key: string, value: unknown): void {
    this.cache.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }
}

export default AssetManager;
