# Migration Report

## Detection Summary
- Detected runtime: angular
- Detected Angular version: 19
- Target Angular version: 20
- Package manager: npm
- Lockfile: package-lock.json
- angular.json: true
- tsconfig.json: true
- Global Angular CLI was not modified.
- Angular CLI official update runs only for policy-required hops.
- Command source: project-local npm scripts for validation and project-local Angular CLI for official Angular updates
- Angular CLI source: project-local dependency for official updates and validation scripts
- Global Angular CLI: not used for official Angular updates
- Global install/update: not performed

## Planned Migration Hops
- Angular 19 -> 20

## Migration Hops
- [failed] Angular 19 -> 20

## Dependency Compatibility Issues
- No issues recorded

## Dependency Compatibility Remediations
- No remediations recorded

## AI Remediation Changes
- Not run or no changes applied

## AI Remediation Root Cause Analysis
- incompatible Angular library package: hop=19 -> 20; package=.bin; files=; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=canvg; files=node_modules/canvg/lib/index.es.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=ngx-barcode6; files=node_modules/ngx-barcode6/fesm2022/ngx-barcode6.mjs; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=ngx-moment; files=node_modules/ngx-moment/fesm2020/ngx-moment.mjs; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=.bin; files=; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=canvg; files=node_modules/canvg/lib/index.es.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=ngx-barcode6; files=node_modules/ngx-barcode6/fesm2022/ngx-barcode6.mjs; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=ngx-moment; files=node_modules/ngx-moment/fesm2020/ngx-moment.mjs; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=.bin; files=; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=canvg; files=node_modules/canvg/lib/index.es.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=19 -> 20; package=ngx-barcode6; files=node_modules/ngx-barcode6/fesm2022/ngx-barcode6.mjs; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False

## Third-Party Validation Blockers
- None

## Persistent CSS Remediation State
- None

## Validation Failures
- Command: node_modules\.bin\ng.cmd build
  Exit code: 1
  Failure category: compiler
  Error tail: For more info see: https://angular.dev/tools/cli/build#configuring-commonjs-dependencies Warning: D:\Projects\AI\Ang_15\src\app\services\common.service.ts depends on 'moment'. CommonJS or AMD dependencies can cause optimization bailouts. For more info see: https://angular.dev/tools/cli/build#configuring-commonjs-dependencies [39m[22m [1m[31m Error: [96msrc/app/Component/delivery-mode/delivery-mode.component.ts[0m:[93m1693[0m:[93m61[0m - [91merror[0m[90m TS2740: [0mType '{ Id: null; Name: string; }[]' is missing the following properties from type 'Observable<LocationMasterData[]>': source, operator, lift, subscribe, and 2 more. [7m1693[0m     return suggestedLocations.length ? suggestedLocations : [{ Id: null, Name: 'No results found' }]; [7m    [0m [91m                                                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m Error: [96msrc/app/Component/review-and-buy/review-buy-and-delivery/review-buy-and-delivery.component.ts[0m:[93m1732[0m:[93m61[0m - [91merror[0m[90m TS2740: [0mType '{ Id: null; Name: string; }[]' is missing the following properties from type 'Observable<LocationMasterData[]>': source, operator, lift, subscribe, and 2 more. [7m1732[0m     return suggestedLocations.length ? suggestedLocations : [{ Id: null, Name: 'No results found' }]; [7m    [0m [91m                                                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m [39m[22m
  Migration hop: 19 -> 20
  Remediation attempted: True
  Remediation applied: False
  Remediation rejected: True
  Manual correction required: True

## Manual Correction Required
- Reason: AI requested manual correction.
- Failed command: node_modules\.bin\ng.cmd build
- Final error: Build verification command returned a non-zero exit code.
- Reason remediation stopped: AI requested manual correction.
- Rejected AI plan reason: AI requested manual correction.
- AI plan returned: True
- AI returned manual correction: True
- AI plan rejected by safety: True
- Safety rejection reason: AI requested manual correction.
  File: unknown
  Error: Build verification command returned a non-zero exit code.
  Suggested manual next step: Check Angular, @angular/compiler-cli, @angular-devkit/build-angular, and TypeScript version compatibility for the current hop, then rerun the failed validation command.
  Risk: AI requested manual correction.
  Validation command: node_modules\.bin\ng.cmd build
- Snapshot path: D:\Projects\AI\rollback\20260617-124649-9ee21a8f
- Output path: D:\Projects\AI\Ang_15

## Warnings
- Preflight dependency compatibility check skipped by configuration.

## AI Package Categorisation
- Angular 19 -> 20: @angular/animations upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/cdk upgrade -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/cli upgrade -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/common upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/compiler upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/core upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch.)
- Angular 19 -> 20: @angular/forms upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/localize upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/material upgrade -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/material-moment-adapter upgrade -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/platform-browser upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/platform-browser-dynamic upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/router upgrade -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @babel/runtime manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @ng-bootstrap/ng-bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @ng-idle/core manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @ng-idle/keepalive manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @ngbracket/ngx-layout manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @popperjs/core manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: crypto-js manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: express manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: force manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: guid-typescript manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: hammerjs manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: html2canvas manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: jsbarcode manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: jspdf manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: lz-string manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: moment manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: moment-timezone manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-barcode6 manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-cookie-service manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-device-detector manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-logger manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-moment manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-order-pipe manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-pagination manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ngx-spinner manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: rxjs preserve (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: rxjs-compat manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: smoothscroll-polyfill manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: tslib preserve (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: zone.js preserve (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @angular-devkit/build-angular upgrade -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/compiler-cli upgrade -> 20.3.25 (Synchronized Angular compiler package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/language-service upgrade -> 20.3.25 (Synchronized Angular language service package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @types/jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @types/jasminewd2 manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: @types/node manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: codelyzer manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: eslint manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: jasmine-core manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: jasmine-spec-reporter manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: karma manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: karma-chrome-launcher manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: karma-coverage-istanbul-reporter manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: karma-jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: karma-jasmine-html-reporter manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: ts-node preserve (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: typescript upgrade -> >=5.9.0 <6.0.0 (Angular 20.3 compiler compatibility requires TypeScript in the bounded 5.9 range and the current TypeScript 5.5 range is incompatible.)
- Angular 19 -> 20: webpack-bundle-analyzer manual_review (Preserved unless Angular compatibility requires a change.)

## AI Package Version Recommendations
- [accepted] Angular 19 -> 20: package=@angular/animations; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/animations@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/cdk; aiRecommended=20; npmVerificationCommand=`npm view @angular/cdk@20 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/cli; aiRecommended=20; npmVerificationCommand=`npm view @angular/cli@20 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/common; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/common@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/compiler; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/compiler@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/core; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/core@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/forms; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/forms@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/localize; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/localize@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/material; aiRecommended=20; npmVerificationCommand=`npm view @angular/material@20 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/material-moment-adapter; aiRecommended=20; npmVerificationCommand=`npm view @angular/material-moment-adapter@20 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/platform-browser; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/platform-browser@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/platform-browser-dynamic; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/platform-browser-dynamic@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/router; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/router@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular-devkit/build-angular; aiRecommended=20; npmVerificationCommand=`npm view @angular-devkit/build-angular@20 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/compiler-cli; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/compiler-cli@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [accepted] Angular 19 -> 20: package=@angular/language-service; aiRecommended=20.3.25; npmVerificationCommand=`npm view @angular/language-service@20.3.25 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=20.3.25; fallbackReason=; aiOverriddenByNpm=False
- [fallbackResolved] Angular 19 -> 20: package=typescript; aiRecommended=>=5.9.0 <6.0.0; npmVerificationCommand=``; npmVerification=skipped; aiReRecommended=; finalSelected=>=5.9.0 <6.0.0; fallbackReason=Skipped upfront npm view verification because install-first mode is enabled; npm install will validate this range.; aiOverriddenByNpm=False

## Package Version Verification
- @angular/animations
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/cdk
  - AI recommended: 20
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20
  - hop: Angular 19 -> 20
- @angular/cli
  - AI recommended: 20
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20
  - hop: Angular 19 -> 20
- @angular/common
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/compiler
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/core
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/forms
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/localize
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/material
  - AI recommended: 20
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20
  - hop: Angular 19 -> 20
- @angular/material-moment-adapter
  - AI recommended: 20
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20
  - hop: Angular 19 -> 20
- @angular/platform-browser
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/platform-browser-dynamic
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/router
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular-devkit/build-angular
  - AI recommended: 20
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20
  - hop: Angular 19 -> 20
- @angular/compiler-cli
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- @angular/language-service
  - AI recommended: 20.3.25
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: 20.3.25
  - hop: Angular 19 -> 20
- typescript
  - AI recommended: >=5.9.0 <6.0.0
  - verification mode: install-first
  - npm view: skipped because install-first mode is enabled
  - install result: npm install succeeded
  - final selected range: >=5.9.0 <6.0.0
  - hop: Angular 19 -> 20

## Angular Critical Dependency Alignment
- [recommended] Angular 19 -> 20: @angular/animations: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/common: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/compiler: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/core: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch.
- [recommended] Angular 19 -> 20: @angular/forms: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/localize: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/platform-browser: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/platform-browser-dynamic: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/router: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/compiler-cli: ^19.0.0 -> 20.3.25
  Criticality: required
  Reason: Synchronized Angular compiler package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: @angular/language-service: ^19.0.0 -> 20.3.25
  Criticality: recommended
  Reason: Synchronized Angular language service package must use the supplied exact Angular 20 target patch shared with @angular/core.
- [recommended] Angular 19 -> 20: typescript: ~5.5.2 -> >=5.9.0 <6.0.0
  Criticality: required
  Reason: Angular 20.3 compiler compatibility requires TypeScript in the bounded 5.9 range and the current TypeScript 5.5 range is incompatible.
- [preserved] Angular 19 -> 20: rxjs: ^7.4.0
  Criticality: required
  Reason: The current RxJS range is compatible with Angular 20 and should be preserved.
- [preserved] Angular 19 -> 20: zone.js: ~0.15.0
  Criticality: required
  Reason: The current zone.js range is compatible with Angular 20 and should be preserved.
- [preserved] Angular 19 -> 20: tslib: ^2.6.2
  Criticality: required
  Reason: The current tslib range is compatible with Angular 20 and should be preserved.
- [rejected] Angular 19 -> 20: @angular/cdk: ^19.0.0 -> 
  Reason: Critical dependency recommendation confidence is below 60.
- [rejected] Angular 19 -> 20: @angular/material: ^19.0.0 -> 
  Reason: Critical dependency recommendation confidence is below 60.
- [rejected] Angular 19 -> 20: @angular/material-moment-adapter: ^19.0.0 -> 
  Reason: Critical dependency recommendation confidence is below 60.
- [rejected] Angular 19 -> 20: @angular/cli: ^19.0.0 -> 
  Reason: Critical dependency recommendation confidence is below 60.
- [rejected] Angular 19 -> 20: @angular-devkit/build-angular: ^19.0.0 -> 
  Reason: Critical dependency recommendation confidence is below 60.
- [accepted] Angular 19 -> 20: @angular/cli: 20 -> 20.3.28
  Criticality: required
  Reason: Local package metadata shows Angular CLI 20 resolved to 20.3.28 for the target Angular major; align to that exact discovered major-scoped package version instead of forcing the @angular/core patch.
- [accepted] Angular 19 -> 20: @angular-devkit/build-angular: 20 -> 20.3.28
  Criticality: required
  Reason: Local package metadata shows Angular build tooling 20 resolved to 20.3.28 and its peers accept Angular 20 and TypeScript >=5.8 <6.0; align to that exact discovered major-scoped package version instead of forcing the @angular/core patch.

## Angular Package Upgrade Plan
- Angular 19 -> 20: @angular/animations angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/cdk angular_framework_package -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/cli angular_tooling_package -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/common angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/compiler angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/core angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch.)
- Angular 19 -> 20: @angular/forms angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/localize angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/material angular_framework_package -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/material-moment-adapter angular_framework_package -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/platform-browser angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/platform-browser-dynamic angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/router angular_framework_package -> 20.3.25 (Synchronized Angular framework package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular-devkit/build-angular angular_tooling_package -> 20 (Package should align with Angular 20.)
- Angular 19 -> 20: @angular/compiler-cli angular_tooling_package -> 20.3.25 (Synchronized Angular compiler package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: @angular/language-service angular_tooling_package -> 20.3.25 (Synchronized Angular language service package must use the supplied exact Angular 20 target patch shared with @angular/core.)
- Angular 19 -> 20: typescript typescript_runtime_or_compiler_package -> >=5.9.0 <6.0.0 (Angular 20.3 compiler compatibility requires TypeScript in the bounded 5.9 range and the current TypeScript 5.5 range is incompatible.)

## Third-Party Package Decisions
- None

## Angular Structural Config Changes
- None

## Rejected AI Package Suggestions
- None

## Rejected AI Config Suggestions
- None

## Manual Review Required
- Angular 19 -> 20: manual_review auto-accept enabled: True; received=5; applied=0; failed=0; files changed by auto-accepted manual_review items=none
- Warning: manual_review changes were auto-applied because intervention UI is not implemented yet.
- Angular 19 -> 20: package @babel/runtime (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @ng-bootstrap/ng-bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @ng-idle/core (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @ng-idle/keepalive (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @ngbracket/ngx-layout (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @popperjs/core (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package crypto-js (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package express (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package force (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package guid-typescript (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package hammerjs (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package html2canvas (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package jsbarcode (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package jspdf (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package lz-string (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package moment (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package moment-timezone (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-barcode6 (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-cookie-service (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-device-detector (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-logger (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-moment (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-order-pipe (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-pagination (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package ngx-spinner (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package rxjs-compat (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package smoothscroll-polyfill (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @types/jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @types/jasminewd2 (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @types/node (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package codelyzer (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package eslint (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package jasmine-core (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package jasmine-spec-reporter (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package karma (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package karma-chrome-launcher (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package karma-coverage-istanbul-reporter (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package karma-jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package karma-jasmine-html-reporter (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package webpack-bundle-analyzer (Preserved unless Angular compatibility requires a change.)
- Angular 19 -> 20: package @angular/cdk (Critical dependency recommendation confidence is below 60.)
- Angular 19 -> 20: package @angular/material (Critical dependency recommendation confidence is below 60.)
- Angular 19 -> 20: package @angular/material-moment-adapter (Critical dependency recommendation confidence is below 60.)
- Angular 19 -> 20: package @angular/cli (Critical dependency recommendation confidence is below 60.)
- Angular 19 -> 20: package @angular-devkit/build-angular (Critical dependency recommendation confidence is below 60.)
- Angular 19 -> 20: config angular.json (The workspace still uses legacy custom targets for lint and e2e with builders that may not be available or supported in Angular 20; exact replacement depends on the project's chosen lint and e2e tooling, so no safe direct patch is proposed.)
- Angular 19 -> 20: config angular.json (The build target uses @angular-devkit/build-angular:browser. Angular 20 projects commonly use newer build infrastructure, but migrating this safely can require coordinated option changes and validation, so it should be handled by Angular CLI migration or manual review rather than an exact snippet replacement here.)
- Angular 19 -> 20: config angular.json (The es5 build configuration references ./tsconfig.es5.json, but that file content was not supplied and ES5-oriented configurations may be incompatible with current Angular browser support expectations; exact safe replacement is unclear.)
- Angular 19 -> 20: config package.json (The start script runs ng serve --configuration es5, which depends on the es5 Angular configuration. Because removing or changing it may alter the served build behavior, no automatic script patch is proposed without validation.)
- Angular 19 -> 20: config tsconfig.json (The TypeScript target and moduleResolution settings are older than typical Angular 20 workspace defaults, but changing compiler options can affect emitted JavaScript and compatibility; this should be validated by Angular compiler output rather than patched automatically.)

## Clean Install Summary
- Angular 19 -> 20: node_modules deleted=False; package-lock.json deleted=True; install command=`npm install --ignore-scripts --no-audit --no-fund`; fallback used=False

## Validation Summary
- Angular 19 -> 20: passed=false; installFallbackUsed=False; migrateOnlySkipped=True

## Validation
- Validation command executed by migration agent: node_modules\.bin\ng.cmd build
- Result: failed

## Build Verification
- Angular 19 -> 20: build verification attempted=True; command=`node_modules\.bin\ng.cmd build`; executor=local-angular-cli; passed=False; skipped=False; next hop started only after build verification passed=False; failure reason=Build verification command returned a non-zero exit code.

## Angular CLI Official Update Status
- Angular 19 -> 20: official update triggered=False; skipped=True; required=False; reason=skipped because package/config-only migration

## Preflight Dependency Compatibility Analysis
- Hop: Angular 19 -> 20
- Status: passed

## Execution Log
- Angular 19 -> 20

## Commands Executed
- [failed] npm install --ignore-scripts --no-audit --no-fund
- [failed] npm install --ignore-scripts --no-audit --no-fund
- [failed] npm install --ignore-scripts --no-audit --no-fund
- [passed] npm install --ignore-scripts --no-audit --no-fund
- [failed] node_modules\.bin\ng.cmd build
- [passed] npm ls typescript
- [passed] npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund
- [failed] node_modules\.bin\ng.cmd build

## Install Fallback Usage
- Used --legacy-peer-deps after peer dependency conflict: npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund

## Install Strategy Decisions
- Source=ai-install-strategy; strategy=normalInstall; command=`npm install --ignore-scripts --no-audit --no-fund`; confidence=0.86; risk=low; fallback=False; retry=False; retryCount=0; legacy-peer-deps=False; elapsed=3.3522657s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=First install attempt with no prior npm failure; normal install is required before considering any fallback.
- Source=ai-install-strategy; strategy=normalInstall; command=`npm install --ignore-scripts --no-audit --no-fund`; confidence=0.85; risk=low; fallback=False; retry=True; retryCount=0; legacy-peer-deps=False; elapsed=7.1269538s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=No prior install failure output is provided and failure classification is none, so the safest allowed install action is the normal npm install command.
- Source=ai-install-strategy; strategy=normalInstall; command=`npm install --ignore-scripts --no-audit --no-fund`; confidence=0.86; risk=low; fallback=False; retry=True; retryCount=0; legacy-peer-deps=False; elapsed=3.0047262s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=No install failure output or actionable failure classification was provided, so the safest allowed install action is the normal npm install command.
- Source=ai-install-strategy; strategy=normalInstall; command=`npm install --ignore-scripts --no-audit --no-fund`; confidence=0.78; risk=low; fallback=False; retry=True; retryCount=0; legacy-peer-deps=False; elapsed=189.6401247s; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=No npm failure output or actionable failure classification was provided, so there is no safe basis for fallback or retry behavior; use the normal install command.
- Source=angular-critical-dependency-alignment-remediation; strategy=legacyPeerDepsInstall; command=`npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund`; confidence=1; risk=medium; fallback=True; retry=True; retryCount=1; legacy-peer-deps=True; elapsed=2.957101s; aiUsed=False; aiAccepted=False; manualActionRequired=False; reason=Reinstalling after Angular critical dependency alignment corrected a compiler/build-tool incompatibility.

## Peer Dependency Conflicts
- Angular 19 -> 20: package=@angular/common; requiredRange=^19.0.0; planned=20.3.25; installed=20.3.25; requiredBy=@ng-bootstrap/ng-bootstrap@18.0.0; classification=thirdPartyPeerConflict; decision=revisePackagePlan
- Angular 19 -> 20: package=@angular/common; requiredRange=^19.0.0; planned=20.3.25; installed=20.3.25; requiredBy=ngx-cookie-service@19.1.2; classification=thirdPartyPeerConflict; decision=revisePackagePlan
- Angular 19 -> 20: package=@angular/common; requiredRange=^19.0.0; planned=20.3.25; installed=20.3.25; requiredBy=ngx-device-detector@9.0.0; classification=thirdPartyPeerConflict; decision=revisePackagePlan

## Install Strategy Summary
- Angular 19 -> 20: AI install strategy used=True; AI install strategy accepted=True; transient network retries used=0; peer dependency fallback used=False; manual action required=False

## Command Failure Classification
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.

## Dependency Changes
- Managed by AI package categorisation and safety-checked package.json updates.

## Structural File Changes
- package-lock.json
- package.json

## Validation Results
- Angular 19 -> 20: passed=false

## Optional Angular Migrations
- None

## Manual Actions Required
- Review failed hop: 19 -> 20

## Failures / Manual Actions Required
- Failed hop: 19 -> 20
- Snapshot available at: D:\Projects\AI\rollback\20260617-124649-9ee21a8f
- Rollback mode: manual
- Automatic rollback applied: False
