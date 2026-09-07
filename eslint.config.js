import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import generatedGlobals from './eslint.generated-globals.js';

export default tseslint.config(
    // Base ESLint recommended rules
    js.configs.recommended,

    // TypeScript rules for .ts files (currently unused - migration complete)
    // Note: All TypeScript source files have been migrated to JavaScript runtime
    // ...tseslint.configs.recommended.map(config => ({
    //     ...config,
    //     files: ['src/**/*.ts']
    // })),

    // Prettier compatibility (disables conflicting rules)
    prettier,

    // Global configuration
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                indexedDB: 'readonly',
                fetch: 'readonly',
                getComputedStyle: 'readonly',
                navigator: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                atob: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                location: 'readonly',
                history: 'readonly',
                BroadcastChannel: 'readonly',
                ClipboardEvent: 'readonly',
                CustomEvent: 'readonly',
                DataTransfer: 'readonly',
                Event: 'readonly',
                HTMLElement: 'readonly',
                HTMLInputElement: 'readonly',
                Element: 'readonly',
                Node: 'readonly',
                NodeList: 'readonly',
                DocumentFragment: 'readonly',
                IntersectionObserver: 'readonly',
                MutationObserver: 'readonly',
                ResizeObserver: 'readonly',
                File: 'readonly',
                FileReader: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                FormData: 'readonly',
                Headers: 'readonly',
                Request: 'readonly',
                Response: 'readonly',
                AbortController: 'readonly',
                DOMParser: 'readonly',
                structuredClone: 'readonly',
                crypto: 'readonly',
                Audio: 'readonly',
                AudioContext: 'readonly',
                // App globals
                D: 'writable',
                $: 'readonly',
                $$: 'readonly',
                esc: 'readonly',
                log: 'readonly',
                save: 'readonly',
                showToast: 'readonly',
                showModal: 'readonly',
                hideModal: 'readonly',
                debounce: 'readonly',
                throttle: 'readonly',
                renderAll: 'readonly',
                switchView: 'readonly',
                ErrorHandler: 'readonly',
                EntityLookup: 'readonly',
                CURRENT_VERSION: 'readonly'
            }
        }
    },

    // Generierte projekteigene Cross-Modul-Globals — aus loader.js MODULES
    // abgeleitet (ARCH-01, D-08). Additiv zum vorherigen globals-Block: Flat
    // Config mergt languageOptions.globals ueber Konfigurationsobjekte hinweg,
    // nichts wird ersetzt. Nicht von Hand bearbeiten — siehe
    // eslint.generated-globals.js und tools/generate-eslint-globals.js.
    {
        languageOptions: {
            globals: generatedGlobals
        }
    },

    // JavaScript files configuration
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
        rules: {
            // Relaxed rules for existing JS code
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            'no-undef': 'warn',
            'no-console': 'off',
            'no-empty': 'warn',
            'no-prototype-builtins': 'off',
            'no-useless-escape': 'warn',
            'no-constant-condition': 'warn',
            'no-fallthrough': 'warn',
            // Emoji-Zeichenklassen im Bestand (dice-core.js) — bewusst 'warn', kein u-Flag-Umbau in der Stabilisierungsphase
            'no-misleading-character-class': 'warn'
        }
    },

    // TypeScript files configuration (currently unused - migration complete)
    // Note: All TypeScript source files have been migrated to JavaScript runtime
    // {
    //     files: ['src/**/*.ts'],
    //     rules: {
    //         // Stricter rules for new TypeScript code
    //         '@typescript-eslint/no-unused-vars': ['error', {
    //             argsIgnorePattern: '^_',
    //             varsIgnorePattern: '^_'
    //         }],
    //         '@typescript-eslint/explicit-function-return-type': 'off',
    //         '@typescript-eslint/no-explicit-any': 'warn',
    //         '@typescript-eslint/no-non-null-assertion': 'off',
    //         '@typescript-eslint/no-this-alias': 'off',
    //         'no-console': ['warn', { allow: ['warn', 'error'] }]
    //     }
    // },

    // Test files configuration
    {
        files: ['tests/**/*.js', 'tests/**/*.ts'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly',
                // Node-Globals — decken die reine Konfigurationsluecke in
                // tests/** ab (D-08, Task 2). Buffer ist eine gemessene
                // Ergaenzung ueber die sechs PLAN.md-Namen hinaus: es wird in
                // tests/e2e/features/import-security.spec.js und
                // soundboard.spec.js verwendet und war ohne diesen Eintrag
                // weiterhin ein no-undef-Fund (Live-Baum-Messung, Task 2).
                require: 'readonly',
                module: 'writable',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                global: 'readonly',
                Buffer: 'readonly',
                // tests/setup.js definiert diese sieben Helfer als global.* —
                // zur Testlaufzeit real vorhanden (D-08, Task 2)
                createTestCharacter: 'readonly',
                createTestEncounter: 'readonly',
                createTestNPC: 'readonly',
                deleteCharacter: 'readonly',
                genId: 'readonly',
                renderInitiative: 'readonly',
                resetTestState: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off'
        }
    },

    // CommonJS-Konfigurationsdateien (.cjs) — Node-Globals + entschärfte Stil-Regeln
    {
        files: ['**/*.cjs'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                module: 'writable',
                require: 'readonly',
                __dirname: 'readonly',
                process: 'readonly'
            }
        },
        rules: {
            'no-useless-escape': 'warn'
        }
    },

    // Node-seitige Dateien ausserhalb von tests/** (D-08, Task 2): dieselben
    // sechs Node-Globals wie im tests/**-Block. tools/debug.js braucht
    // darueber hinaus nichts — seine Projektnamen kommen bereits aus dem
    // generierten Artefakt aus Task 1.
    {
        files: ['tools/**/*.js', 'playwright.config.js', 'playwright.smoke.config.js'],
        languageOptions: {
            globals: {
                require: 'readonly',
                module: 'writable',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                global: 'readonly'
            }
        }
    },

    // utils/testable-utils.js laeuft doppelt: im Browser ueber loader.js und
    // in Jest ueber require(); die module.exports-Zeile am Dateiende ist
    // beabsichtigt (D-08, Task 2). Eng gefasster Block statt module global
    // freizugeben.
    {
        files: ['utils/testable-utils.js'],
        languageOptions: {
            globals: {
                module: 'writable'
            }
        }
    },

    // Ignore patterns
    {
        ignores: ['node_modules/**', 'dist/**', 'coverage/**', '*.min.js', 'sw.js']
    }
);
