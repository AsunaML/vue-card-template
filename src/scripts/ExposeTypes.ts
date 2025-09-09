import { type MyRef } from "./MyRef"
import type { ExposeInterface } from "../../tavern-script/modal-controller"
import * as Comlink from "comlink"

export type Expose = MyRef<Comlink.Remote<ExposeInterface> | null>
