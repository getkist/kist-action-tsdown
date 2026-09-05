// ============================================================================
// Import
// ============================================================================

import { TsdownAction } from "./actions/TsdownAction/index.js";
import { ActionPlugin } from "./types/Action.js";

// ============================================================================
// Export
// ============================================================================

export { TsdownAction } from "./actions/TsdownAction/index.js";
export type { TsdownActionOptions, TsdownFormat } from "./actions/TsdownAction/index.js";
export { Action, ActionPlugin } from "./types/Action.js";
export type { ActionOptionsType } from "./types/Action.js";

// ============================================================================
// Plugin Definition
// ============================================================================

/**
 * The kist plugin manifest for this package. kist's plugin loader requires a
 * `registerActions` function and ignores a plugin that does not provide one,
 * so the actions must be handed over from here rather than declared as a
 * static map. It returns constructors, not instances: kist instantiates an
 * action per step, so a shared instance would leak state between steps.
 */
const plugin: ActionPlugin = {
    name: "@getkist/action-tsdown",
    version: "1.0.26",
    description: "tsdown bundler action for kist",
    author: "kist",
    repository: "https://github.com/getkist/kist-action-tsdown",
    keywords: ["kist", "kist-action", "tsdown", "rolldown", "bundler"],
    registerActions() {
        return {
            TsdownAction,
        };
    },
};

export default plugin;
