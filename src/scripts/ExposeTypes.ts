import { type MyRef } from "./MyRef"
import type { ExposeInterface } from "../../tavern-script/ModalController"
import * as Comlink from "comlink"

export type Expose = MyRef<Comlink.Remote<ExposeInterface> | null>
