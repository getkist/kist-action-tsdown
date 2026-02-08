import { TsdownAction } from "./actions/TsdownAction/index.js";

export { TsdownAction } from "./actions/TsdownAction/index.js";
export type { TsdownActionOptions, TsdownFormat } from "./actions/TsdownAction/index.js";
export { Action } from "./types/Action.js";

/**
 * Plugin definition for kist
 */
export default {
    name: "@getkist/action-tsdown",
    version: "1.0.0",
    actions: {
        TsdownAction: new TsdownAction(),
    },
};
