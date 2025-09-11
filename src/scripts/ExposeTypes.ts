import { type MyRef } from "./MyRef"
import type { ExposeInterface } from "../../tavern-script/ModalController"
import * as Comlink from "comlink"

export type Remoteize<T> = {
  [K in keyof T]: Comlink.Remote<T[K]>
};

export type Expose = MyRef<Remoteize<ExposeInterface> | null>
