import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    // Base ESLint recommended rules
    js.configs.recommended,

    // TypeScript rules for .ts files
    ...tseslint.configs.recommended.map(config => ({
        ...config,
        files: ['src/**/*.ts']
    })),

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
                navigator: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                location: 'readonly',
                history: 'readonly',
                CustomEvent: 'readonly',
                Event: 'readonly',
                HTMLElement: 'readonly',
                Element: 'readonly',
                Node: 'readonly',
                NodeList: 'readonly',
                DocumentFragment: 'readonly',
                IntersectionObserver: 'readonly',
                MutationObserver: 'readonly',
                ResizeObserver: 'readonly',
                FileReader: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                FormData: 'readonly',
                Headers: 'readonly',
                Request: 'readonly',
                Response: 'readonly',
                AbortController: 'readonly',
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

    // JavaScript files configuration
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
        rules: {
            // Relaxed rules for existing JS code
            'no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'no-undef': 'warn',
            'no-console': 'off',
            'no-empty': 'warn',
            'no-prototype-builtins': 'off',
            'no-useless-escape': 'warn',
            'no-constant-condition': 'warn',
            'no-fallthrough': 'warn'
        }
    },

    // TypeScript files configuration
    {
        files: ['src/**/*.ts'],
        rules: {
            // Stricter rules for new TypeScript code
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            'no-console': ['warn', { allow: ['warn', 'error'] }]
        }
    },

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
                jest: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off'
        }
    },

    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            '*.min.js',
            'sw.js'
        ]
    }
);
