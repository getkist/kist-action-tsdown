# @getkist/action-tsdown

tsdown bundler action for [kist](https://github.com/getkist/kist) build tool.

[![npm version](https://img.shields.io/npm/v/@getkist/action-tsdown.svg)](https://www.npmjs.com/package/@getkist/action-tsdown)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **tsdown Integration** - Bundle TypeScript/JavaScript using Rolldown
- **Multiple Formats** - Output ESM, CJS, and IIFE bundles
- **Type Declarations** - Generate TypeScript declaration files
- **Tree Shaking** - Automatic dead code elimination
- **Watch Mode** - Development-friendly file watching

## Installation

```bash
npm install --save-dev @getkist/action-tsdown
```

## Usage

### Basic Bundling

Add to your `kist.yml`:

```yaml
pipeline:
    stages:
        - name: build
          steps:
              - name: bundle
                action: TsdownAction
                options:
                    entry: ./src/index.ts
                    outDir: ./dist
```

### Multiple Formats

```yaml
pipeline:
    stages:
        - name: build
          steps:
              - name: bundle-all-formats
                action: TsdownAction
                options:
                    entry: ./src/index.ts
                    outDir: ./dist
                    format:
                        - esm
                        - cjs
                    dts: true
```

### Production Build

```yaml
pipeline:
    stages:
        - name: build
          steps:
              - name: production-bundle
                action: TsdownAction
                options:
                    entry:
                        - ./src/index.ts
                        - ./src/cli.ts
                    outDir: ./dist
                    format: esm
                    minify: true
                    sourcemap: true
                    clean: true
                    treeshake: true
                    target: es2022
```

### Library Build

```yaml
pipeline:
    stages:
        - name: build
          steps:
              - name: library-bundle
                action: TsdownAction
                options:
                    entry: ./src/index.ts
                    outDir: ./dist
                    format:
                        - esm
                        - cjs
                    dts: true
                    external:
                        - react
                        - react-dom
                    platform: browser
```

## Action: TsdownAction

Bundles TypeScript/JavaScript using tsdown (powered by Rolldown).

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entry` | string \| string[] | **required** | Entry point file(s) |
| `outDir` | string | "./dist" | Output directory |
| `format` | "esm" \| "cjs" \| "iife" | "esm" | Output format(s) |
| `dts` | boolean | false | Generate TypeScript declarations |
| `minify` | boolean | false | Minify output |
| `sourcemap` | boolean \| "inline" | false | Generate sourcemaps |
| `clean` | boolean | false | Clean output directory |
| `external` | string[] | - | External packages to exclude |
| `globalName` | string | - | Global variable name (for IIFE) |
| `target` | string | - | Target environment (es2020, etc.) |
| `tsconfig` | string | - | Path to tsconfig.json |
| `watch` | boolean | false | Watch mode |
| `treeshake` | boolean | true | Enable tree shaking |
| `define` | object | - | Global constant definitions |
| `env` | object | - | Environment variables to inline |
| `platform` | "node" \| "browser" \| "neutral" | "node" | Target platform |
| `bundle` | boolean | true | Bundle node_modules |
| `noExternal` | string[] | - | Packages to include in bundle |
| `splitting` | boolean | - | Enable code splitting |
| `configPath` | string | - | Path to tsdown.config.ts |

## Requirements

- Node.js >= 20.0.0
- kist >= 0.1.58

## License

MIT