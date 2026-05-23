# Migration Report

## Detection Summary
- Detected runtime: angular
- Detected Angular version: 13
- Target Angular version: 15
- Package manager: npm
- Lockfile: package-lock.json
- angular.json: true
- tsconfig.json: true
- Global Angular CLI was not modified.
- Angular CLI migrate-only is skipped by default.
- Command source: project-local npm scripts and node_modules binaries only
- Angular CLI source: project-local dependency when validation scripts invoke it
- Global Angular CLI: not used
- Global install/update: not performed

## Planned Migration Hops
- Angular 13 -> 14
- Angular 14 -> 15

## Migration Hops
- [done] Angular 13 -> 14
- [done] Angular 14 -> 15

## Dependency Compatibility Issues
- No issues recorded

## Dependency Compatibility Remediations
- No remediations recorded

## AI Remediation Changes
### Attempt 1
- Trigger: validation/build failure
- Failed command: npm run build
- Failure cause: Angular CLI rejected deprecated --prod flag
- Failure category: script
- Remediation mode: deterministic
- File changed: package.json
- Change type: script_update
- Change: replaced --prod with --configuration production in package.json scripts
- Exact unresolved imports remaining after remediation: none
- Reason: Angular CLI no longer accepts the deprecated --prod build flag.
- Confidence: 1
- Risk: low
- Business logic changed: no
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 1
- Trigger: validation/build failure
- Failed command: npm run build
- Failure cause: A package style import no longer resolves under the current Angular/Webpack style pipeline, and a same-package style asset replacement was confirmed.
- Failure category: css_dependency_import
- Remediation mode: deterministic
- File changed: src/assets/css/style.css, src/assets/front/css/front-style.css
  File: src/assets/css/style.css
  File: src/assets/front/css/front-style.css
- Change type: style_import_update
- Change: updated unresolved package style imports using deterministic import resolution
- Root cause: package style import no longer resolves under the current Angular/Webpack style pipeline
- Package: @ng-select/ng-select
- Installed version: 8.3.0
- Before: ~@ng-select/ng-select/themes/material.theme.css, ~@ng-select/ng-select/themes/default.theme.css
- After: ../../../node_modules/@ng-select/ng-select/themes/material.theme.css, ../../../../node_modules/@ng-select/ng-select/themes/default.theme.css
#### CSS Import Remediation Resolution
- Original import: ~@ng-select/ng-select/themes/material.theme.css
  Source file: src/assets/css/style.css
  Selected strategy: relative_node_modules_css_import
  Replacement import: ../../../node_modules/@ng-select/ng-select/themes/material.theme.css
  Evidence: physical CSS file exists: node_modules/@ng-select/ng-select/themes/material.theme.css; relative path computed from source stylesheet directory
  Rejected candidates: direct_package_import=package_exports_block_subpath
  Confidence: 0.98
- Original import: ~@ng-select/ng-select/themes/default.theme.css
  Source file: src/assets/front/css/front-style.css
  Selected strategy: relative_node_modules_css_import
  Replacement import: ../../../../node_modules/@ng-select/ng-select/themes/default.theme.css
  Evidence: physical CSS file exists: node_modules/@ng-select/ng-select/themes/default.theme.css; relative path computed from source stylesheet directory
  Rejected candidates: direct_package_import=package_exports_block_subpath
  Confidence: 0.98
- Unresolved dependency imports from Can't resolve: ~@ng-select/ng-select/themes/material.theme.css, ~@ng-select/ng-select/themes/default.theme.css
- Loader/resource stylesheet files from error chain: src/app/customer/product-configurator-detail/product-configurator-detail.component.scss, src/assets/css/style.css, src/assets/front/css/front-style.css, src/styles.scss
- Stylesheet files containing unresolved dependency imports: src/assets/css/style.css, src/assets/front/css/front-style.css
- Exact unresolved imports remaining after remediation: none
- Deterministic remediation attempted: true
- Deterministic remediation applied: true
- Deterministic remediation rejected: false
- AI remediation attempted: false
- AI remediation applied: false
- Direct normalized import attempted: @ng-select/ng-select/themes/material.theme.css, @ng-select/ng-select/themes/default.theme.css
  Style import: src/assets/css/style.css: ~@ng-select/ng-select/themes/material.theme.css -> ../../../node_modules/@ng-select/ng-select/themes/material.theme.css
    Direct normalized import attempted: @ng-select/ng-select/themes/material.theme.css
    Final selected import: ../../../node_modules/@ng-select/ng-select/themes/material.theme.css
    Final chosen remediation: relative_node_modules_css_import
  Style import: src/assets/front/css/front-style.css: ~@ng-select/ng-select/themes/default.theme.css -> ../../../../node_modules/@ng-select/ng-select/themes/default.theme.css
    Direct normalized import attempted: @ng-select/ng-select/themes/default.theme.css
    Final selected import: ../../../../node_modules/@ng-select/ng-select/themes/default.theme.css
    Final chosen remediation: relative_node_modules_css_import
- Reason: Angular/Webpack could not resolve the package style import; the replacement is selected by package exports and filesystem evidence.
- Confidence: 0.98
- Risk: low
- Business logic changed: no
- Manual critical attention required: no
- Review note: Only package style import statements were changed; no TypeScript, HTML, package versions, selectors, or CSS declarations were modified.
- Result after rerun: passed
- Result: validation rerun passed
- Next action: continue normal validation pipeline
### Attempt 2
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: type_declaration
- Remediation mode: deterministic
- AI proposed type shim
- Validation failed because third-party declaration file referenced missing VisibilityState type.
- AI remediation attempted: type_shim
- Shim applied: True
- Build passed after remediation: True
- File changed: src/types/third-party-compat.d.ts
- Change type: type_shim
- Change: type_shim
- Package: ngx-pinch-zoom
- Exact unresolved imports remaining after remediation: none
- Reason: Adds a project-owned ambient type used only by ngx-pinch-zoom declaration files.
- Business logic changed: no
- Result after rerun: passed
- Result: validation rerun passed
- Next action: continue normal validation pipeline

## AI Remediation Root Cause Analysis
- incompatible Angular library package: hop=13 -> 14; package=ngx-pinch-zoom; files=node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=14 -> 15; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=14 -> 15; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=14 -> 15; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=14 -> 15; package=css-loader; files=node_modules/css-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=14 -> 15; package=mini-css-extract-plugin; files=node_modules/mini-css-extract-plugin/dist/loader.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False

## Third-Party Validation Blockers
- Angular 13 -> 14: package=ngx-pinch-zoom; current=^2.5.6; errorCategory=third_party_declaration_type_missing; evidence=- ngx-pinch-zoom [es2015/esm2015] (git+https://github.com/drozhzhin-n-e/ngx-pinch-zoom.git) | - ng6-toastr-notifications [es2015/esm2015] () | - ngx-bootstrap/modal [es2015/esm2015] (git+ssh://git@github.com/valor-software/ngx-bootstrap.git); selectedRemediation=shim_types_only; target=ngx-pinch-zoom@not selected; installResult=not required; buildRetryResult=passed

## Persistent CSS Remediation State
- None

## Validation Failures
- Command: npm run build
  Exit code: 1
  Failure category: script
  Error tail: $ npm run build exit code: 1 > jewelex@0.0.0 build > ng build --prod --aot --build-optimizer --output-hashing=all Error: Unknown argument: prod
  Migration hop: 13 -> 14
  Remediation attempted: True
  Remediation applied: True
  Remediation rejected: False
  Manual correction required: False
- Command: npm run build
  Exit code: 1
  Failure category: type_declaration
  Error tail: Encourage the library authors to publish an Ivy distribution. - angular-user-idle [es2015/esm2015] (https://github.com/rednez/angular-user-idle.git) √ Browser application bundle generation complete. √ Browser application bundle generation complete. Warning: D:\Projects\AI\Ang_15\src\app\customer\product-configurator-detail\product-configurator-detail.component.ts depends on 'jquery'. CommonJS or AMD dependencies can cause optimization bailouts. For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies Error: node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts:54:25 - error TS2304: Cannot find name 'VisibilityState'. 54     get hostOverflow(): VisibilityState;                            ~~~~~~~~~~~~~~~ Error: node_modules/ngx-pinch-zoom/lib/pinch-zoom.component.d.ts:80:20 - error TS2304: Cannot find name 'VisibilityState'. 80         overflow?: VisibilityState;                       ~~~~~~~~~~~~~~~
  Migration hop: 13 -> 14
  Remediation attempted: True
  Remediation applied: True
  Remediation rejected: False
  Manual correction required: False
- Command: npm run build
  Exit code: 1
  Failure category: css_dependency_import
  Error tail: Warning: D:\Projects\AI\Ang_15\src\app\customer\product-configurator-detail\product-configurator-detail.component.ts depends on 'jquery'. CommonJS or AMD dependencies can cause optimization bailouts. For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies ./src/assets/css/style.css - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js): Error: Can't resolve '~@ng-select/ng-select/themes/material.theme.css' in 'D:\Projects\AI\Ang_15\src\assets\css' ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].rules[0].oneOf[0].use[1]!./node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[5].rules[0].oneOf[0].use[2]!./src/assets/front/css/front-style.css - Error: Module build failed (from ./node_modules/css-loader/dist/cjs.js): Error: Can't resolve '~@ng-select/ng-select/themes/default.theme.css' in 'D:\Projects\AI\Ang_15\src\assets\front\css' ./src/assets/css/style.css?ngGlobalStyle - Error: Module build failed (from ./node_modules/mini-css-extract-plugin/dist/loader.js): HookWebpackError: Module build failed (from ./node_modules/css-loader/dist/cjs.js): Error: Can't resolve '~@ng-select/ng-select/themes/material.theme.css' in 'D:\Projects\AI\Ang_15\src\assets\css' ./src/styles.scss?ngGlobalStyle - Error: Module build failed (from ./node_modules/mini-css-extract-plugin/dist/loader.js): HookWebpackError: Module build failed (from ./node_modules/css-loader/dist/cjs.js): Error: Can't resolve '~@ng-select/ng-select/themes/default.theme.css' in 'D:\Projects\AI\Ang_15\src\assets\front\css'
  Migration hop: 14 -> 15
  Remediation attempted: True
  Remediation applied: True
  Remediation rejected: False
  Manual correction required: False

## Manual Correction Required
- None

## Warnings
- Preflight dependency compatibility check skipped by configuration.
- Preflight dependency compatibility check skipped by configuration.

## AI Package Categorisation
- Angular 13 -> 14: - manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: @angular-slider/ngx-slider manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: @angular/animations upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/cdk upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/common upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/compiler upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/core upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/forms upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/material upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/platform-browser upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/platform-browser-dynamic upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/router upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @fortawesome/fontawesome-free manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: @ng-select/ng-option-highlight manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: @ng-select/ng-select manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: angular-user-idle manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: angularx-qrcode manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ng-dynamic-breadcrumb manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ng6-toastr-notifications manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-color-picker manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-cookie-service manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-device-detector manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-image-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-img-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-pagination manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-pinch-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-red-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: ngx-slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: rxjs preserve (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: swiper manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: tslib preserve (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: xlsx manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: zone.js preserve (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: @angular-devkit/build-angular upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/cli upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/compiler-cli upgrade -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @types/jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: @types/jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: @types/node manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: jasmine-core manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: karma manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: karma-chrome-launcher manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: karma-coverage manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: karma-jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: karma-jasmine-html-reporter manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: typescript upgrade -> ~4.8.4 (Package should align with Angular 14.)
- Angular 14 -> 15: - manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: @angular-slider/ngx-slider manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: @angular/animations upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/cdk upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/common upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/compiler upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/core upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/forms upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/material upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/platform-browser upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/platform-browser-dynamic upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/router upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @fortawesome/fontawesome-free manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: @ng-select/ng-option-highlight manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: @ng-select/ng-select manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: angular-user-idle manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: angularx-qrcode manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ng-dynamic-breadcrumb manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ng6-toastr-notifications manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-color-picker manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-cookie-service manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-device-detector manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-image-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-img-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-pagination manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-pinch-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-red-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: ngx-slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: rxjs preserve (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: swiper manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: tslib preserve (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: xlsx manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: zone.js preserve (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: @angular-devkit/build-angular upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/cli upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/compiler-cli upgrade -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @types/jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: @types/jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: @types/node manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: jasmine-core manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: karma manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: karma-chrome-launcher manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: karma-coverage manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: karma-jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: karma-jasmine-html-reporter manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: typescript upgrade -> ~4.9.5 (Package should align with Angular 15.)

## AI Package Version Recommendations
- [resolvedFallback] Angular 13 -> 14: package=@angular/animations; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/animations@^14.0.0 version --json`; npmVerification=timeout; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=npm verification timed out for @angular/animations@^14.0.0; broad discovery was not attempted. Proceeding because install-first mode uses npm install as the source of truth.; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/cdk; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/cdk@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/common; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/common@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/compiler; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/compiler@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/core; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/core@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/forms; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/forms@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/material; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/material@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/platform-browser; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/platform-browser@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/platform-browser-dynamic; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/platform-browser-dynamic@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/router; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/router@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular-devkit/build-angular; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular-devkit/build-angular@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/cli; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/cli@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=@angular/compiler-cli; aiRecommended=^14.0.0; npmVerificationCommand=`npm view @angular/compiler-cli@^14.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^14.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 13 -> 14: package=typescript; aiRecommended=~4.8.4; npmVerificationCommand=`npm view typescript@~4.8.4 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=~4.8.4; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/animations; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/animations@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/cdk; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/cdk@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/common; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/common@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/compiler; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/compiler@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/core; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/core@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/forms; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/forms@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/material; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/material@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/platform-browser; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/platform-browser@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/platform-browser-dynamic; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/platform-browser-dynamic@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/router; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/router@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular-devkit/build-angular; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular-devkit/build-angular@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/cli; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/cli@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=@angular/compiler-cli; aiRecommended=^15.0.0; npmVerificationCommand=`npm view @angular/compiler-cli@^15.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^15.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 14 -> 15: package=typescript; aiRecommended=~4.9.5; npmVerificationCommand=`npm view typescript@~4.9.5 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=~4.9.5; fallbackReason=; aiOverriddenByNpm=False

## Package Version Verification
- @angular/animations
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: timeout; skipped due to timeout and deferred to npm install
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/cdk
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/common
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/compiler
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/core
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/forms
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/material
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/platform-browser
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/platform-browser-dynamic
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/router
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular-devkit/build-angular
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/cli
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- @angular/compiler-cli
  - AI recommended: ^14.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^14.0.0
  - hop: Angular 13 -> 14
- typescript
  - AI recommended: ~4.8.4
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ~4.8.4
  - hop: Angular 13 -> 14
- @angular/animations
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/cdk
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/common
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/compiler
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/core
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/forms
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/material
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/platform-browser
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/platform-browser-dynamic
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/router
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular-devkit/build-angular
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/cli
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- @angular/compiler-cli
  - AI recommended: ^15.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^15.0.0
  - hop: Angular 14 -> 15
- typescript
  - AI recommended: ~4.9.5
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ~4.9.5
  - hop: Angular 14 -> 15

## Angular Critical Dependency Alignment
- None

## Angular Package Upgrade Plan
- Angular 13 -> 14: @angular/animations angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/cdk angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/common angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/compiler angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/core angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/forms angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/material angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/platform-browser angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/platform-browser-dynamic angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/router angular_framework_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular-devkit/build-angular angular_tooling_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/cli angular_tooling_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: @angular/compiler-cli angular_tooling_package -> ^14.0.0 (Package should align with Angular 14.)
- Angular 13 -> 14: typescript typescript_runtime_or_compiler_package -> ~4.8.4 (Package should align with Angular 14.)
- Angular 14 -> 15: @angular/animations angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/cdk angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/common angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/compiler angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/core angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/forms angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/material angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/platform-browser angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/platform-browser-dynamic angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/router angular_framework_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular-devkit/build-angular angular_tooling_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/cli angular_tooling_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: @angular/compiler-cli angular_tooling_package -> ^15.0.0 (Package should align with Angular 15.)
- Angular 14 -> 15: typescript typescript_runtime_or_compiler_package -> ~4.9.5 (Package should align with Angular 15.)

## Third-Party Package Decisions
- None

## Angular Structural Config Changes
- None

## Rejected AI Package Suggestions
- None

## Rejected AI Config Suggestions
- Angular 13 -> 14: item  (AI config plan was unavailable or invalid.)
- Angular 14 -> 15: item  (AI config plan was unavailable or invalid.)

## Manual Review Required
- Angular 13 -> 14: package - (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package @angular-slider/ngx-slider (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package @fortawesome/fontawesome-free (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package @ng-select/ng-option-highlight (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package @ng-select/ng-select (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package angular-user-idle (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package angularx-qrcode (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package jquery (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ng-dynamic-breadcrumb (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ng6-toastr-notifications (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-color-picker (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-cookie-service (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-device-detector (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-image-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-img-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-pagination (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-pinch-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-red-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package ngx-slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package swiper (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package xlsx (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package @types/jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package @types/jquery (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package @types/node (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package jasmine-core (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package karma (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package karma-chrome-launcher (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package karma-coverage (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package karma-jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package karma-jasmine-html-reporter (Preserved unless Angular compatibility requires a change.)
- Angular 13 -> 14: package typescript (TypeScript ~4.5.2 is incompatible with Angular 14; critical dependency alignment requires manual review before build.)
- Angular 14 -> 15: package - (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package @angular-slider/ngx-slider (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package @fortawesome/fontawesome-free (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package @ng-select/ng-option-highlight (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package @ng-select/ng-select (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package angular-user-idle (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package angularx-qrcode (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package jquery (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ng-dynamic-breadcrumb (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ng6-toastr-notifications (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-color-picker (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-cookie-service (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-device-detector (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-image-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-img-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-pagination (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-pinch-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-red-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package ngx-slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package swiper (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package xlsx (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package @types/jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package @types/jquery (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package @types/node (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package jasmine-core (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package karma (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package karma-chrome-launcher (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package karma-coverage (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package karma-jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 14 -> 15: package karma-jasmine-html-reporter (Preserved unless Angular compatibility requires a change.)

## Clean Install Summary
- Angular 13 -> 14: node_modules deleted=False; package-lock.json deleted=True; install command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; fallback used=True
- Angular 14 -> 15: node_modules deleted=True; package-lock.json deleted=True; install command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; fallback used=True

## Validation Summary
- Angular 13 -> 14: passed=true; installFallbackUsed=True; migrateOnlySkipped=True
- Angular 14 -> 15: passed=true; installFallbackUsed=True; migrateOnlySkipped=True

## Validation
- Validation command executed by migration agent: npm run build
- Result: passed

## Build Verification
- Angular 13 -> 14: build verification attempted=True; command=`npm run build`; executor=npm-script; passed=True; skipped=False; next hop started only after build verification passed=True
- Angular 14 -> 15: build verification attempted=True; command=`npm run build`; executor=npm-script; passed=True; skipped=False; next hop started only after build verification passed=True

## Angular CLI Migrate-only Status
- Angular 13 -> 14: skipped=True; reason=disabled by new default flow
- Angular 14 -> 15: skipped=True; reason=disabled by new default flow

## Preflight Dependency Compatibility Analysis
- Hop: Angular 13 -> 14
- Status: passed
- Hop: Angular 14 -> 15
- Status: passed

## Execution Log
- Angular 13 -> 14
- Angular 14 -> 15

## Commands Executed
- [failed] npm install --no-audit --no-fund --prefer-offline
- [passed] npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- [failed] npm run build
- [failed] npm run build
- [passed] npm run build
- [failed] npm install --no-audit --no-fund --prefer-offline
- [passed] npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- [failed] npm run build
- [passed] npm run build

## Install Fallback Usage
- Used --legacy-peer-deps after peer dependency conflict: npm install --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline

## Install Strategy Decisions
- Source=deterministic-safety-fallback; strategy=normalInstall; command=`npm install --no-audit --no-fund --prefer-offline`; confidence=1; risk=low; fallback=True; retry=False; retryCount=0; legacy-peer-deps=False; elapsed=1.4815714s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Default deterministic npm install strategy.
- Source=deterministic-safety-fallback; strategy=legacyPeerDepsInstall; command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; confidence=1; risk=medium; fallback=True; retry=True; retryCount=1; legacy-peer-deps=True; elapsed=114.1338189s; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Previous npm install failed with a peer dependency conflict and legacy peer deps fallback is enabled.
- Source=deterministic-safety-fallback; strategy=normalInstall; command=`npm install --no-audit --no-fund --prefer-offline`; confidence=1; risk=low; fallback=True; retry=False; retryCount=0; legacy-peer-deps=False; elapsed=1.5441421s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Default deterministic npm install strategy.
- Source=deterministic-safety-fallback; strategy=legacyPeerDepsInstall; command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; confidence=1; risk=medium; fallback=True; retry=True; retryCount=1; legacy-peer-deps=True; elapsed=108.3046564s; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Previous npm install failed with a peer dependency conflict and legacy peer deps fallback is enabled.

## Peer Dependency Conflicts
- Angular 13 -> 14: package=@angular/common; requiredRange=^13.0.0; planned=^14.0.0; installed=14.3.0; requiredBy=@angular-slider/ngx-slider@13.0.0; classification=thirdPartyPeerConflict; decision=legacyPeerDepsFallback
- Angular 14 -> 15: package=@angular/common; requiredRange=^13.0.0; planned=^15.0.0; installed=15.2.10; requiredBy=@angular-slider/ngx-slider@13.0.0; classification=thirdPartyPeerConflict; decision=legacyPeerDepsFallback

## Install Strategy Summary
- Angular 13 -> 14: AI install strategy used=True; AI install strategy accepted=False; AI install strategy rejected reason=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; transient network retries used=0; peer dependency fallback used=True; manual action required=False
- Angular 14 -> 15: AI install strategy used=True; AI install strategy accepted=False; AI install strategy rejected reason=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; transient network retries used=0; peer dependency fallback used=True; manual action required=False

## Command Failure Classification
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.

## Dependency Changes
- Managed by AI package categorisation and safety-checked package.json updates.

## Structural File Changes
- package-lock.json
- package.json

## Validation Results
- Angular 13 -> 14: passed=true
- Angular 14 -> 15: passed=true

## Optional Angular Migrations
- None

## Manual Actions Required
- None

## Failures / Manual Actions Required
- None
- Rollback mode: manual
- Automatic rollback applied: False
