/**
 * Implementation of Vite's virtual module convention
 * https://vite.dev/guide/api-plugin#virtual-modules-convention
 */
export class VirtualModule {
  #id: string;

  constructor(name: string) {
    this.#id = `virtual:orange/${name}`;
  }

  is(id: string) {
    return id === this.#id || id === this.id;
  }

  get id() {
    return `\0${this.#id}`;
  }

  get raw() {
    return this.#id;
  }

  get url() {
    return `/@id/__x00__${this.#id}`;
  }

  static findPrefix(prefix: string, id: string) {
    const namespacedPrefix = `\0virtual:orange/${prefix}`;
    if (id.startsWith(namespacedPrefix)) {
      return id.slice(namespacedPrefix.length - 1);
    }
  }
}
