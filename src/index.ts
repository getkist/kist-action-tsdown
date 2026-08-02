// ============================================================================
// Import
// ============================================================================

import { TsdownAction } from "./actions/TsdownAction/index.js";

// ============================================================================
// Export
// ============================================================================

export { TsdownAction } from "./actions/TsdownAction/index.js";
export type { TsdownActionOptions, TsdownFormat } from "./actions/TsdownAction/index.js";
export { Action } from "./types/Action.js";

// ============================================================================
// Plugin Definition
// ============================================================================

/**
 * Plugin manifest for `@getkist/action-tsdown`. This is the package's
 * default export, discovered and loaded by kist when the plugin is
 * referenced from a project's kist configuration; kist reads `actions` to
 * register each action instance under its key (e.g. `TsdownAction`) so it
 * can be invoked via `action: TsdownAction` in a kist.yaml pipeline step.
 * Actions are instantiated once here and reused across pipeline runs.
 */
export default {
    name: "@getkist/action-tsdown",
    version: "1.0.25",
    actions: {
        TsdownAction: new TsdownAction(),
    },
};
