import { jest } from "@jest/globals";

import fs from "fs/promises";
import path from "path";

import { TsdownAction } from "../../src/actions/TsdownAction/TsdownAction.js";

/**
 * Runs the real tsdown CLI and asserts on the bundle it writes. Fixtures live
 * under the repository because tsdown resolves `tsconfig.json` relative to its
 * working directory, and `silent` keeps the bundler's own output out of the
 * test report.
 */
describe("TsdownAction integration", () => {
    const tmpDir = path.join(process.cwd(), "tst", "integration", `.tmp-${Date.now()}`);
    const srcDir = path.join(tmpDir, "src");
    const entry = path.join(srcDir, "index.ts");

    // Bundling is not fast; the default 5s timeout is not enough for a cold run.
    jest.setTimeout(120_000);

    beforeAll(async () => {
        await fs.mkdir(srcDir, { recursive: true });
        await fs.writeFile(
            path.join(srcDir, "helper.ts"),
            "export const suffix = '!';\n",
            "utf8",
        );
        await fs.writeFile(
            entry,
            "import { suffix } from './helper.js';\n" +
                "export function greet(name: string): string {\n" +
                "    return `hi ${name}${suffix}`;\n" +
                "}\n",
            "utf8",
        );
    });

    afterAll(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it("bundles a single entry point and inlines its imports", async () => {
        const outDir = path.join(tmpDir, "single");

        await new TsdownAction().execute({
            entry,
            outDir,
            format: "esm",
            dts: false,
            silent: true,
        });

        const files = await fs.readdir(outDir);
        const bundle = files.find((f) => f.endsWith(".mjs") || f.endsWith(".js"));
        expect(bundle).toBeDefined();

        const code = await fs.readFile(path.join(outDir, bundle!), "utf8");
        expect(code).toContain("greet");
        expect(code).not.toContain("./helper.js");
    });

    it("accepts an array of entry points", async () => {
        const outDir = path.join(tmpDir, "array");

        await new TsdownAction().execute({
            entry: [entry],
            outDir,
            format: "esm",
            dts: false,
            silent: true,
        });

        expect(await fs.readdir(outDir)).not.toHaveLength(0);
    });

    it("emits one file per requested format", async () => {
        const outDir = path.join(tmpDir, "dual");

        await new TsdownAction().execute({
            entry,
            outDir,
            format: ["cjs", "esm"],
            dts: false,
            silent: true,
        });

        const files = await fs.readdir(outDir);
        expect(files.length).toBeGreaterThan(1);
    });

    it("rejects when the entry point does not exist", async () => {
        await expect(
            new TsdownAction().execute({
                entry: path.join(srcDir, "missing.ts"),
                outDir: path.join(tmpDir, "never"),
                dts: false,
                silent: true,
            }),
        ).rejects.toThrow();
    });

    it("rejects before invoking tsdown when entry is empty", async () => {
        await expect(
            new TsdownAction().execute({ entry: [], silent: true }),
        ).rejects.toThrow();
    });
});
