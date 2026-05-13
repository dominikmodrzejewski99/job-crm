import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // The app is a single deployment, not a published lib — strict prefix
      // discipline applies to libs/design-system (enforced there). Here we
      // freely use feature-based names like main-page, applications-grid,
      // dashboard-funnel, login-page, etc.
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/component-selector': 'off',
      // Same rationale as design-system: ARIA-shaped input aliases such as
      // `aria-labelledby` and short toggles like `error` are part of the
      // intentional public API.
      '@angular-eslint/no-input-rename': 'off',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // WCAG AA enforcement — every a11y rule from @angular-eslint/template
      // bumped to "error" so violations fail the build, not just warn.
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/table-scope': 'error',
      '@angular-eslint/template/valid-aria': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/role-has-required-aria': 'error',
    },
  },
];
