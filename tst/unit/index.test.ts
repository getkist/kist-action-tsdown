import { createRequire } from "module";

import plugin, { Action, ActionPlugin, TsdownAction } from "../../src/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { name: string; version: string };

describe("package entry point", () => {
    it("re-exports every action it provides", () => {
        expect(TsdownAction).toBeDefined();
        expect(new TsdownAction()).toBeInstanceOf(Action);
    });

    it("exports a plugin manifest as the default export", () => {
        const manifest: ActionPlugin = plugin;
        expect(typeof manifest.version).toBe("string");
        expect(manifest.description).toBeTruthy();
        expect(manifest.keywords).toEqual(
            expect.arrayContaining(["kist", "kist-action"]),
        );
    });

    // The manifest version is hand-written, so it silently drifts from the
    // published version unless something compares the two.
    it("declares the same version as package.json", () => {
        expect(plugin.version).toBe(pkg.version);
    });

    // kist's PluginManager ignores any plugin whose default export has no
    // `registerActions` function, and reads nothing from a static `actions`
    // map — a plugin without this registers zero actions and fails silently.
    it("registers its actions by the name pipeline steps use", () => {
        expect(typeof plugin.registerActions).toBe("function");
        const actions = plugin.registerActions!();
        expect(Object.keys(actions).sort()).toEqual(["TsdownAction"]);
        expect(new actions.TsdownAction()).toBeInstanceOf(TsdownAction);
    });
});
