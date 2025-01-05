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
}
