# Migration Report

## Detection Summary
- Detected runtime: angular
- Detected Angular version: 15
- Target Angular version: 17
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
- Angular 15 -> 16
- Angular 16 -> 17

## Migration Hops
- [done] Angular 15 -> 16
- [done] Angular 16 -> 17

## Dependency Compatibility Issues
- No issues recorded

## Dependency Compatibility Remediations
- No remediations recorded

## AI Remediation Changes
These business/source files were edited by post-validation AI remediation. Review before accepting migration.
- src/app/app.module.ts
### Attempt 1
- Trigger: validation/build failure
- Failed command: npm run build
- Failure cause: Obsolete Angular NgModule metadata property entryComponents
- Failure category: obsolete_angular_metadata
- Remediation mode: deterministic
- File changed: src/app/app.module.ts
- Change type: source_update
- Change: removed entryComponents from NgModule metadata
- Root cause: entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata
- Exact unresolved imports remaining after remediation: none
- Reason: Angular Ivy/Angular 16 no longer supports entryComponents in NgModule metadata.
- Confidence: 1
- Risk: low
- Business logic changed: yes
- Review note: Only Angular metadata was changed; component/service business logic was not modified.
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 2
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: third_party_angular_library_incompatibility
- Remediation mode: ai
- File changed: package.json
- Change type: package_update
- Change: package_update
- Package: angular-user-idle
- Exact unresolved imports remaining after remediation: none
- Reason: Validation proved the installed angular-user-idle package is not Ivy-compatible for this Angular hop.
- Confidence: 1
- Business logic changed: no
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 2
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: third_party_angular_library_incompatibility
- Remediation mode: ai
- File changed: package.json
- Change type: package_update
- Change: package_update
- Package: ngx-bootstrap
- Exact unresolved imports remaining after remediation: none
- Reason: Validation proved the installed ngx-bootstrap package uses Angular metadata APIs removed before Angular 16.
- Confidence: 1
- Business logic changed: no
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 2
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: third_party_angular_library_incompatibility
- Remediation mode: ai
- File changed: package.json
- Change type: package_update
- Change: package_update
- Package: ngx-color-picker
- Exact unresolved imports remaining after remediation: none
- Reason: Validation proved the installed ngx-color-picker package imports Angular APIs removed in Angular 16.
- Confidence: 1
- Business logic changed: no
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 2
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: third_party_angular_library_incompatibility
- Remediation mode: ai
- File changed: package.json
- Change type: package_update
- Change: package_update
- Package: ngx-pinch-zoom
- Exact unresolved imports remaining after remediation: none
- Reason: Validation proved ngx-pinch-zoom module metadata is incompatible; the verified alias preserves the original package name through npm aliasing.
- Confidence: 1
- Business logic changed: no
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 2
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: third_party_angular_library_incompatibility
- Remediation mode: ai
- File changed: package.json
- Change type: package_update
- Change: package_update
- Package: ngx-slick-carousel
- Exact unresolved imports remaining after remediation: none
- Reason: Validation proved the installed ngx-slick-carousel package is not Ivy-compatible for this Angular hop.
- Confidence: 1
- Business logic changed: no
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 2
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: third_party_angular_incompatibility
- Remediation mode: deterministic
- File changed: src/app/compat/ng6-toastr-notifications.ts
- Change type: compatibility_shim
- Change: compatibility_shim
- Package: ng6-toastr-notifications
- Exact unresolved imports remaining after remediation: none
- Reason: Added a project-owned import-surface compatibility shim for an abandoned Angular package after validation proved the package blocks Angular 16.
- Business logic changed: no
- Review note: Compatibility shim preserves ToastrModule and ToastrManager import names used by the app; manual review is required because runtime notification behavior is represented by source compatibility code.
- Result after rerun: failed
- Result: validation rerun failed
- Next action: continue remediation or manual correction
### Attempt 3
- Trigger: validation/build failure
- Failed command: validation command
- Failure cause: validation_proven_third_party_blocker
- Failure category: third_party_angular_library_incompatibility
- Remediation mode: ai
- File changed: package.json
- Change type: package_update
- Change: package_update
- Package: ngx-pagination
- Exact unresolved imports remaining after remediation: none
- Reason: Validation proved the installed ngx-pagination package is not Ivy-compatible for this Angular hop.
- Confidence: 1
- Business logic changed: no
- Result after rerun: passed
- Result: validation rerun passed
- Next action: continue normal validation pipeline

## AI Remediation Root Cause Analysis
- incompatible Angular library package: hop=15 -> 16; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- obsolete Angular metadata: hop=15 -> 16; file=src/app/customer/product-configurator-detail/product-configurator-detail.component.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/app.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/shared/shared.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/customer/customer.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/admin.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/auth/auth.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/components/article-master/article-master.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/components/attribute-master/attribute-master.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/components/bulk-import/bulk-import.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/components/category-master/category-master.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/components/image-view-master/image-view.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/components/role-master/role-master.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/components/user-role-mapping/user-role-mapping.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- obsolete Angular metadata: hop=15 -> 16; file=src/app/modules/admin/dashboard/dashboard.module.ts; symbol=entryComponents; reason=entryComponents is obsolete under Ivy and invalid in Angular 16 NgModule metadata.
- incompatible Angular library package: hop=15 -> 16; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-color-picker; files=node_modules/ngx-color-picker/fesm2015/ngx-color-picker.js; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ng6-toastr-notifications; files=node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js, node_modules/ng6-toastr-notifications/lib/toastr.module.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-bootstrap; files=node_modules/ngx-bootstrap/component-loader/component-loader.factory.d.ts, node_modules/ngx-bootstrap/focus-trap/focus-trap-manager.d.ts, node_modules/ngx-bootstrap/focus-trap/focus-trap.d.ts, node_modules/ngx-bootstrap/focus-trap/focus-trap.module.d.ts, node_modules/ngx-bootstrap/focus-trap/interactivity-checker.d.ts, node_modules/ngx-bootstrap/focus-trap/platform.d.ts, node_modules/ngx-bootstrap/modal/bs-modal-ref.service.d.ts, node_modules/ngx-bootstrap/modal/bs-modal.service.d.ts, node_modules/ngx-bootstrap/modal/modal-backdrop.component.d.ts, node_modules/ngx-bootstrap/modal/modal-container.component.d.ts, node_modules/ngx-bootstrap/modal/modal-options.class.d.ts, node_modules/ngx-bootstrap/modal/modal.directive.d.ts, node_modules/ngx-bootstrap/modal/modal.module.d.ts, node_modules/ngx-bootstrap/positioning/positioning.service.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=@angular/core; files=; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-slick-carousel; files=node_modules/ngx-slick-carousel/index.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-pinch-zoom; files=node_modules/ngx-pinch-zoom/lib/pinch-zoom.module.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=angular-user-idle; files=node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-color-picker; files=node_modules/ngx-color-picker/fesm2015/ngx-color-picker.js; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ng6-toastr-notifications; files=node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js, node_modules/ng6-toastr-notifications/lib/toastr.module.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-bootstrap; files=node_modules/ngx-bootstrap/component-loader/component-loader.factory.d.ts, node_modules/ngx-bootstrap/focus-trap/focus-trap-manager.d.ts, node_modules/ngx-bootstrap/focus-trap/focus-trap.d.ts, node_modules/ngx-bootstrap/focus-trap/focus-trap.module.d.ts, node_modules/ngx-bootstrap/focus-trap/interactivity-checker.d.ts, node_modules/ngx-bootstrap/focus-trap/platform.d.ts, node_modules/ngx-bootstrap/modal/bs-modal-ref.service.d.ts, node_modules/ngx-bootstrap/modal/bs-modal.service.d.ts, node_modules/ngx-bootstrap/modal/modal-backdrop.component.d.ts, node_modules/ngx-bootstrap/modal/modal-container.component.d.ts, node_modules/ngx-bootstrap/modal/modal-options.class.d.ts, node_modules/ngx-bootstrap/modal/modal.directive.d.ts, node_modules/ngx-bootstrap/modal/modal.module.d.ts, node_modules/ngx-bootstrap/positioning/positioning.service.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=@angular/core; files=; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-slick-carousel; files=node_modules/ngx-slick-carousel/index.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-pinch-zoom; files=node_modules/ngx-pinch-zoom/lib/pinch-zoom.module.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=angular-user-idle; files=node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts; reason=Angular-library-incompatible; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=15 -> 16; package=ngx-pagination; files=node_modules/ngx-pagination/dist/ngx-pagination.module.d.ts; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=16 -> 17; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False
- incompatible Angular library package: hop=16 -> 17; package=postcss-loader; files=node_modules/postcss-loader/dist/cjs.js; reason=third-party Angular library Ivy/partial-compilation incompatibility; editNodeModules=False

## Third-Party Validation Blockers
- Angular 15 -> 16: package=angular-user-idle; current=^2.2.6; errorCategory=third_party_angular_library_incompatibility; evidence=node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts:3:22 | 3 export declare class UserIdleModule { | This likely means that the library (angular-user-idle) which declares UserIdleModule is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy.; selectedRemediation=upgrade; target=angular-user-idle@^4.0.0; installResult=passed; buildRetryResult=failed
- Angular 15 -> 16: package=ng6-toastr-notifications; current=^1.0.4; errorCategory=third_party_angular_library_incompatibility; evidence=./node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:293:39-65 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery) | ./node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:294:37-77 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery) | Error: node_modules/ngx-bootstrap/component-loader/component-loader.factory.d.ts:19:25 - error TS2694: Namespace '"D:/Projects/AI/AiMigration/Output/node_modules/@angular/core/index"' has no exported member 'ɵɵFactoryDef'.; selectedRemediation=compatibility_shim; target=ng6-toastr-notifications@not selected; installResult=not required; buildRetryResult=failed
- Angular 15 -> 16: package=ngx-bootstrap; current=^7.1.0; errorCategory=third_party_angular_library_incompatibility; evidence=./node_modules/ngx-color-picker/fesm2015/ngx-color-picker.js:1231:25-65 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery) | ./node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:293:39-65 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery) | ./node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:294:37-77 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery); selectedRemediation=upgrade; target=ngx-bootstrap@^11.0.2; installResult=passed; buildRetryResult=failed
- Angular 15 -> 16: package=ngx-color-picker; current=^11.0.0; errorCategory=third_party_angular_library_incompatibility; evidence=./node_modules/ngx-color-picker/fesm2015/ngx-color-picker.js:1231:25-65 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery) | ./node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:293:39-65 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery) | ./node_modules/ng6-toastr-notifications/fesm2015/ng6-toastr-notifications.js:294:37-77 - Error: export 'ReflectiveInjector' (imported as 'ReflectiveInjector') was not found in '@angular/core' (possible exports: ANIMATION_MODULE_TYPE, APP_BOOTSTRAP_LISTENER, APP_ID, APP_INITIALIZER, ApplicationInitStatus, ApplicationModule, ApplicationRef, Attribute, COMPILER_OPTIONS, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Compiler, CompilerFactory, Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, ContentChild, ContentChildren, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, DefaultIterableDiffer, DestroyRef, Directive, ENVIRONMENT_INITIALIZER, ElementRef, EmbeddedViewRef, EnvironmentInjector, ErrorHandler, EventEmitter, Host, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectionToken, Injector, Input, IterableDiffers, KeyValueDiffers, LOCALE_ID, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModule, NgModuleFactory, NgModuleRef, NgProbeToken, NgZone, Optional, Output, PACKAGE_ROOT_URL, PLATFORM_ID, PLATFORM_INITIALIZER, Pipe, PlatformRef, Query, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, TransferState, Type, VERSION, Version, ViewChild, ViewChildren, ViewContainerRef, ViewEncapsulation, ViewRef, afterNextRender, afterRender, asNativeElements, assertInInjectionContext, assertPlatform, booleanAttribute, computed, createComponent, createEnvironmentInjector, createNgModule, createNgModuleRef, createPlatform, createPlatformFactory, defineInjectable, destroyPlatform, effect, enableProdMode, forwardRef, getDebugNode, getModuleFactory, getNgModuleById, getPlatform, importProvidersFrom, inject, isDevMode, isSignal, isStandalone, makeEnvironmentProviders, makeStateKey, mergeApplicationConfig, numberAttribute, platformCore, provideZoneChangeDetection, reflectComponentType, resolveForwardRef, runInInjectionContext, setTestabilityGetter, signal, untracked, ɵALLOW_MULTIPLE_PLATFORMS, ɵAfterRenderEventManager, ɵComponentFactory, ɵConsole, ɵDEFAULT_LOCALE_ID, ɵENABLED_SSR_FEATURES, ɵINJECTOR_SCOPE, ɵIS_HYDRATION_DOM_REUSE_ENABLED, ɵInitialRenderPendingTasks, ɵLContext, ɵLifecycleHooksFeature, ɵLocaleDataIndex, ɵNG_COMP_DEF, ɵNG_DIR_DEF, ɵNG_ELEMENT_ID, ɵNG_INJ_DEF, ɵNG_MOD_DEF, ɵNG_PIPE_DEF, ɵNG_PROV_DEF, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, ɵNO_CHANGE, ɵNgModuleFactory, ɵNoopNgZone, ɵReflectionCapabilities, ɵRender3ComponentFactory, ɵRender3ComponentRef, ɵRender3NgModuleRef, ɵRuntimeError, ɵSSR_CONTENT_INTEGRITY_MARKER, ɵTESTABILITY, ɵTESTABILITY_GETTER, ɵViewRef, ɵXSS_SECURITY_URL, ɵ_sanitizeHtml, ɵ_sanitizeUrl, ɵallowSanitizationBypassAndThrow, ɵannotateForHydration, ɵbypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent, ɵcompileDirective, ɵcompileNgModule, ɵcompileNgModuleDefs, ɵcompileNgModuleFactory, ɵcompilePipe, ɵconvertToBitFlags, ɵcreateInjector, ɵdefaultIterableDiffers, ɵdefaultKeyValueDiffers, ɵdetectChanges, ɵdevModeEqual, ɵfindLocaleData, ɵflushModuleScopingQueueAsMuchAsPossible, ɵformatRuntimeError, ɵgetDebugNode, ɵgetDirectives, ɵgetHostElement, ɵgetInjectableDef, ɵgetLContext, ɵgetLocaleCurrencyCode, ɵgetLocalePluralCase, ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, ɵglobal, ɵinjectChangeDetectorRef, ɵinternalCreateApplication, ɵisBoundToModule, ɵisEnvironmentProviders, ɵisInjectable, ɵisNgModule, ɵisPromise, ɵisSubscribable, ɵnoSideEffects, ɵpatchComponentDefWithScope, ɵpublishDefaultGlobalUtils, ɵpublishGlobalUtil, ɵregisterLocaleData, ɵresetCompiledComponents, ɵresetJitOptions, ɵresolveComponentResources, ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetAlternateWeakRefImpl, ɵsetClassMetadata, ɵsetCurrentInjector, ɵsetDocument, ɵsetInjectorProfilerContext, ɵsetLocaleId, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, ɵstore, ɵstringify, ɵtransitiveScopesFor, ɵunregisterLocaleData, ɵunwrapSafeValue, ɵwithDomHydration, ɵɵCopyDefinitionFeature, ɵɵFactoryTarget, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵStandaloneFeature, ɵɵadvance, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcontentQuery, ɵɵdefer, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵdefineNgModule, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdisableBindings, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵenableBindings, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵhostProperty, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinject, ɵɵinjectAttribute, ɵɵinvalidFactory, ɵɵinvalidFactoryDep, ɵɵlistener, ɵɵloadQuery, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵnextContext, ɵɵngDeclareClassMetadata, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryRefresh, ɵɵreference, ɵɵregisterNgModuleType, ɵɵresetView, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵrestoreView, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵvalidateIframeAttribute, ɵɵviewQuery); selectedRemediation=upgrade; target=ngx-color-picker@^16.0.0; installResult=passed; buildRetryResult=failed
- Angular 15 -> 16: package=ngx-pinch-zoom; current=^2.5.6; errorCategory=third_party_angular_library_incompatibility; evidence=node_modules/ngx-pinch-zoom/lib/pinch-zoom.module.d.ts:1:22 | 1 export declare class PinchZoomModule { | This likely means that the library (ngx-pinch-zoom) which declares PinchZoomModule is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy.; selectedRemediation=npm_alias_replacement; target=@mtnair/ngx-pinch-zoom@npm:@mtnair/ngx-pinch-zoom@2.5.12; installResult=passed; buildRetryResult=failed
- Angular 15 -> 16: package=ngx-slick-carousel; current=^0.5.1; errorCategory=third_party_angular_library_incompatibility; evidence=node_modules/ngx-slick-carousel/index.d.ts:2:22 | 2 export declare class SlickCarouselModule { | This likely means that the library (ngx-slick-carousel) which declares SlickCarouselModule is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy.; selectedRemediation=upgrade; target=ngx-slick-carousel@15.0.0; installResult=passed; buildRetryResult=failed
- Angular 15 -> 16: package=ngx-pagination; current=^5.1.1; errorCategory=third_party_angular_library_incompatibility; evidence=node_modules/ngx-pagination/dist/ngx-pagination.module.d.ts:6:22 | 6 export declare class NgxPaginationModule { | ~~~~~~~~~~~~~~~~~~~; selectedRemediation=upgrade; target=ngx-pagination@^6.0.3; installResult=passed; buildRetryResult=passed

## Persistent CSS Remediation State
- Angular 15 -> 16: src/assets/css/style.css: ~@ng-select/ng-select/themes/material.theme.css -> ../../../node_modules/@ng-select/ng-select/themes/material.theme.css; acceptedHop=14 -> 15; enforcement=already_enforced
- Angular 15 -> 16: src/assets/front/css/front-style.css: ~@ng-select/ng-select/themes/default.theme.css -> ../../../../node_modules/@ng-select/ng-select/themes/default.theme.css; acceptedHop=14 -> 15; enforcement=already_enforced
- Angular 16 -> 17: src/assets/css/style.css: ~@ng-select/ng-select/themes/material.theme.css -> ../../../node_modules/@ng-select/ng-select/themes/material.theme.css; acceptedHop=14 -> 15; enforcement=already_enforced
- Angular 16 -> 17: src/assets/front/css/front-style.css: ~@ng-select/ng-select/themes/default.theme.css -> ../../../../node_modules/@ng-select/ng-select/themes/default.theme.css; acceptedHop=14 -> 15; enforcement=already_enforced

## Validation Failures
- Command: npm run build
  Exit code: 1
  Failure category: compiler
  Error tail: ~~~~~~~~~~~~   src/app/shared/shared.module.ts:58:14     58 export class SharedModule { }                     ~~~~~~~~~~~~     Is it missing an @NgModule annotation? Error: src/app/modules/admin/dashboard/dashboard.module.ts:24:5 - error NG6002: 'UserIdleModule' does not appear to be an NgModule class. 24     UserIdleModule,        ~~~~~~~~~~~~~~   node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts:3:22     3 export declare class UserIdleModule {                            ~~~~~~~~~~~~~~     This likely means that the library (angular-user-idle) which declares UserIdleModule is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy.
  Migration hop: 15 -> 16
  Remediation attempted: True
  Remediation applied: True
  Remediation rejected: False
  Manual correction required: False
- Command: npm run build
  Exit code: 1
  Failure category: compiler
  Error tail: ~~~~~~~~~~~~   src/app/shared/shared.module.ts:58:14     58 export class SharedModule { }                     ~~~~~~~~~~~~     Is it missing an @NgModule annotation? Error: src/app/modules/admin/dashboard/dashboard.module.ts:24:5 - error NG6002: 'UserIdleModule' does not appear to be an NgModule class. 24     UserIdleModule,        ~~~~~~~~~~~~~~   node_modules/angular-user-idle/lib/angular-user-idle.module.d.ts:3:22     3 export declare class UserIdleModule {                            ~~~~~~~~~~~~~~     This likely means that the library (angular-user-idle) which declares UserIdleModule is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy.
  Migration hop: 15 -> 16
  Remediation attempted: True
  Remediation applied: True
  Remediation rejected: False
  Manual correction required: False
- Command: npm run build
  Exit code: 1
  Failure category: compiler
  Error tail: ~~~~~~~~~~~~~~~~~~~   node_modules/ngx-pagination/dist/ngx-pagination.module.d.ts:6:22     6 export declare class NgxPaginationModule {                            ~~~~~~~~~~~~~~~~~~~     This likely means that the library (ngx-pagination) which declares NgxPaginationModule is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy. Error: src/app/shared/shared.module.ts:51:5 - error NG6003: 'NgxPaginationModule' does not appear to be an NgModule, Component, Directive, or Pipe class. 51     NgxPaginationModule,        ~~~~~~~~~~~~~~~~~~~   node_modules/ngx-pagination/dist/ngx-pagination.module.d.ts:6:22     6 export declare class NgxPaginationModule {                            ~~~~~~~~~~~~~~~~~~~     This likely means that the library (ngx-pagination) which declares NgxPaginationModule is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy.
  Migration hop: 15 -> 16
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
- Angular 15 -> 16: - manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: @angular-slider/ngx-slider manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: @angular/animations upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/cdk upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/common upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/compiler upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/core upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/forms upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/material upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/platform-browser upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/platform-browser-dynamic upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/router upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @fortawesome/fontawesome-free manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: @ng-select/ng-option-highlight manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: @ng-select/ng-select manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: angular-user-idle manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: angularx-qrcode manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ng-dynamic-breadcrumb manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ng6-toastr-notifications manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-color-picker manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-cookie-service manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-device-detector manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-image-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-img-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-pagination manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-pinch-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-red-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: ngx-slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: rxjs preserve (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: swiper manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: tslib preserve (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: xlsx manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: zone.js upgrade -> ~0.13.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular-devkit/build-angular upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/cli upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/compiler-cli upgrade -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @types/jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: @types/jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: @types/node manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: jasmine-core manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: karma manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: karma-chrome-launcher manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: karma-coverage manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: karma-jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: karma-jasmine-html-reporter manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: typescript upgrade -> ~5.1.6 (Package should align with Angular 16.)
- Angular 16 -> 17: - manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: @angular-slider/ngx-slider manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: @angular/animations upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/cdk upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/common upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/compiler upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/core upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/forms upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/material upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/platform-browser upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/platform-browser-dynamic upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/router upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @fortawesome/fontawesome-free manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: @ng-select/ng-option-highlight manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: @ng-select/ng-select manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: angular-user-idle manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: angularx-qrcode manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ng-dynamic-breadcrumb manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ng6-toastr-notifications manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-bootstrap manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-color-picker manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-cookie-service manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-cookieconsent manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-device-detector manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-image-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-img-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-pagination manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-pinch-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-red-zoom manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: ngx-slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: rxjs preserve (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: slick-carousel manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: swiper manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: tslib preserve (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: xlsx manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: zone.js preserve (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: @angular-devkit/build-angular upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/cli upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/compiler-cli upgrade -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @types/jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: @types/jquery manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: @types/node manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: jasmine-core manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: karma manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: karma-chrome-launcher manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: karma-coverage manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: karma-jasmine manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: karma-jasmine-html-reporter manual_review (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: typescript upgrade -> ~5.4.5 (Package should align with Angular 17.)

## AI Package Version Recommendations
- [npmVerified] Angular 15 -> 16: package=@angular/animations; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/animations@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/cdk; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/cdk@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/common; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/common@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/compiler; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/compiler@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/core; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/core@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/forms; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/forms@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/material; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/material@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/platform-browser; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/platform-browser@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/platform-browser-dynamic; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/platform-browser-dynamic@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/router; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/router@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=zone.js; aiRecommended=~0.13.0; npmVerificationCommand=`npm view zone.js@~0.13.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=~0.13.3; fallbackReason=; aiOverriddenByNpm=True
- [npmVerified] Angular 15 -> 16: package=@angular-devkit/build-angular; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular-devkit/build-angular@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/cli; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/cli@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=@angular/compiler-cli; aiRecommended=^16.0.0; npmVerificationCommand=`npm view @angular/compiler-cli@^16.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^16.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 15 -> 16: package=typescript; aiRecommended=~5.1.6; npmVerificationCommand=`npm view typescript@~5.1.6 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=~5.1.6; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/animations; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/animations@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/cdk; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/cdk@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/common; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/common@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/compiler; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/compiler@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/core; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/core@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/forms; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/forms@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/material; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/material@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/platform-browser; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/platform-browser@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/platform-browser-dynamic; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/platform-browser-dynamic@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/router; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/router@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular-devkit/build-angular; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular-devkit/build-angular@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/cli; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/cli@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=@angular/compiler-cli; aiRecommended=^17.0.0; npmVerificationCommand=`npm view @angular/compiler-cli@^17.0.0 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=^17.0.0; fallbackReason=; aiOverriddenByNpm=False
- [npmVerified] Angular 16 -> 17: package=typescript; aiRecommended=~5.4.5; npmVerificationCommand=`npm view typescript@~5.4.5 version --json`; npmVerification=verified; aiReRecommended=; finalSelected=~5.4.5; fallbackReason=; aiOverriddenByNpm=False

## Package Version Verification
- @angular/animations
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/cdk
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/common
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/compiler
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/core
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/forms
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/material
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/platform-browser
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/platform-browser-dynamic
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/router
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- zone.js
  - AI recommended: ~0.13.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ~0.13.3
  - hop: Angular 15 -> 16
- @angular-devkit/build-angular
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/cli
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- @angular/compiler-cli
  - AI recommended: ^16.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^16.0.0
  - hop: Angular 15 -> 16
- typescript
  - AI recommended: ~5.1.6
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ~5.1.6
  - hop: Angular 15 -> 16
- @angular/animations
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/cdk
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/common
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/compiler
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/core
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/forms
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/material
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/platform-browser
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/platform-browser-dynamic
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/router
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular-devkit/build-angular
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/cli
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- @angular/compiler-cli
  - AI recommended: ^17.0.0
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ^17.0.0
  - hop: Angular 16 -> 17
- typescript
  - AI recommended: ~5.4.5
  - verification mode: install-first
  - npm view: verified
  - install result: npm install succeeded
  - final selected range: ~5.4.5
  - hop: Angular 16 -> 17

## Angular Critical Dependency Alignment
- None

## Angular Package Upgrade Plan
- Angular 15 -> 16: @angular/animations angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/cdk angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/common angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/compiler angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/core angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/forms angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/material angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/platform-browser angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/platform-browser-dynamic angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/router angular_framework_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: zone.js angular_runtime_support_package -> ~0.13.3 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular-devkit/build-angular angular_tooling_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/cli angular_tooling_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: @angular/compiler-cli angular_tooling_package -> ^16.0.0 (Package should align with Angular 16.)
- Angular 15 -> 16: typescript typescript_runtime_or_compiler_package -> ~5.1.6 (Package should align with Angular 16.)
- Angular 16 -> 17: @angular/animations angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/cdk angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/common angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/compiler angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/core angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/forms angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/material angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/platform-browser angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/platform-browser-dynamic angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/router angular_framework_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular-devkit/build-angular angular_tooling_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/cli angular_tooling_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: @angular/compiler-cli angular_tooling_package -> ^17.0.0 (Package should align with Angular 17.)
- Angular 16 -> 17: typescript typescript_runtime_or_compiler_package -> ~5.4.5 (Package should align with Angular 17.)

## Third-Party Package Decisions
- None

## Angular Structural Config Changes
- None

## Rejected AI Package Suggestions
- None

## Rejected AI Config Suggestions
- Angular 15 -> 16: item  (AI config plan was unavailable or invalid.)
- Angular 16 -> 17: item  (AI config plan was unavailable or invalid.)

## Manual Review Required
- Angular 15 -> 16: package - (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package @angular-slider/ngx-slider (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package @fortawesome/fontawesome-free (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package @ng-select/ng-option-highlight (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package @ng-select/ng-select (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package angular-user-idle (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package angularx-qrcode (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package jquery (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ng-dynamic-breadcrumb (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ng6-toastr-notifications (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-color-picker (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-cookie-service (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-device-detector (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-image-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-img-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-pagination (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-pinch-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-red-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package ngx-slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package swiper (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package xlsx (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package @types/jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package @types/jquery (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package @types/node (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package jasmine-core (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package karma (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package karma-chrome-launcher (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package karma-coverage (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package karma-jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 15 -> 16: package karma-jasmine-html-reporter (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package - (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package @angular-slider/ngx-slider (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package @fortawesome/fontawesome-free (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package @ng-select/ng-option-highlight (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package @ng-select/ng-select (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package angular-user-idle (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package angularx-qrcode (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package jquery (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ng-dynamic-breadcrumb (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ng6-toastr-notifications (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-bootstrap (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-color-picker (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-cookie-service (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-cookieconsent (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-device-detector (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-image-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-img-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-pagination (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-pinch-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-red-zoom (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package ngx-slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package slick-carousel (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package swiper (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package xlsx (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package @types/jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package @types/jquery (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package @types/node (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package jasmine-core (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package karma (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package karma-chrome-launcher (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package karma-coverage (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package karma-jasmine (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package karma-jasmine-html-reporter (Preserved unless Angular compatibility requires a change.)
- Angular 16 -> 17: package typescript (TypeScript ~5.1.6 is incompatible with Angular 17; critical dependency alignment requires manual review before build.)

## Clean Install Summary
- Angular 15 -> 16: node_modules deleted=False; package-lock.json deleted=True; install command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; fallback used=True
- Angular 16 -> 17: node_modules deleted=True; package-lock.json deleted=True; install command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; fallback used=True

## Validation Summary
- Angular 15 -> 16: passed=true; installFallbackUsed=True; migrateOnlySkipped=True
- Angular 16 -> 17: passed=true; installFallbackUsed=True; migrateOnlySkipped=True

## Validation
- Validation command executed by migration agent: npm run build
- Result: passed

## Build Verification
- Angular 15 -> 16: build verification attempted=True; command=`npm run build`; executor=npm-script; passed=True; skipped=False; next hop started only after build verification passed=True
- Angular 16 -> 17: build verification attempted=True; command=`npm run build`; executor=npm-script; passed=True; skipped=False; next hop started only after build verification passed=True

## Angular CLI Migrate-only Status
- Angular 15 -> 16: skipped=True; reason=disabled by new default flow
- Angular 16 -> 17: skipped=True; reason=disabled by new default flow

## Preflight Dependency Compatibility Analysis
- Hop: Angular 15 -> 16
- Status: passed
- Hop: Angular 16 -> 17
- Status: passed

## Execution Log
- Angular 15 -> 16
- Angular 16 -> 17

## Commands Executed
- [failed] npm install --no-audit --no-fund --prefer-offline
- [passed] npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- [failed] npm run build
- [failed] npm run build
- [failed] npm install --no-audit --no-fund --prefer-offline
- [passed] npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- [failed] npm run build
- [failed] npm install --no-audit --no-fund --prefer-offline
- [passed] npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- [passed] npm run build
- [failed] npm install --no-audit --no-fund --prefer-offline
- [failed] npm install --no-audit --no-fund --prefer-offline
- [passed] npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- [passed] npm run build

## Install Fallback Usage
- Used --legacy-peer-deps after peer dependency conflict: npm install --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --no-audit --no-fund --prefer-offline
- Used --legacy-peer-deps after peer dependency conflict: npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline

## Install Strategy Decisions
- Source=deterministic-safety-fallback; strategy=normalInstall; command=`npm install --no-audit --no-fund --prefer-offline`; confidence=1; risk=low; fallback=True; retry=False; retryCount=0; legacy-peer-deps=False; elapsed=1.481496s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Default deterministic npm install strategy.
- Source=deterministic-safety-fallback; strategy=legacyPeerDepsInstall; command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; confidence=1; risk=medium; fallback=True; retry=True; retryCount=1; legacy-peer-deps=True; elapsed=106.7489997s; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Previous npm install failed with a peer dependency conflict and legacy peer deps fallback is enabled.
- Source=validation-remediation; strategy=normalInstall; command=`npm install --no-audit --no-fund --prefer-offline`; confidence=1; risk=low; fallback=False; retry=False; retryCount=0; legacy-peer-deps=False; elapsed=2.4495879s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=Package remediation changed package.json; reinstall dependencies before rerunning Angular validation.
- Source=validation-remediation-peer-fallback; strategy=legacyPeerDepsInstall; command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; confidence=1; risk=medium; fallback=True; retry=True; retryCount=1; legacy-peer-deps=True; elapsed=12.0752892s; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=Package remediation install hit ERESOLVE; legacy peer deps is allowed only as fallback.
- Source=validation-remediation; strategy=normalInstall; command=`npm install --no-audit --no-fund --prefer-offline`; confidence=1; risk=low; fallback=False; retry=False; retryCount=0; legacy-peer-deps=False; elapsed=2.3665383s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=Package remediation changed package.json; reinstall dependencies before rerunning Angular validation.
- Source=validation-remediation-peer-fallback; strategy=legacyPeerDepsInstall; command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; confidence=1; risk=medium; fallback=True; retry=True; retryCount=1; legacy-peer-deps=True; elapsed=3.6206979s; aiUsed=True; aiAccepted=True; manualActionRequired=False; reason=Package remediation install hit ERESOLVE; legacy peer deps is allowed only as fallback.
- Source=deterministic-safety-fallback; strategy=normalInstall; command=`npm install --no-audit --no-fund --prefer-offline`; confidence=1; risk=low; fallback=True; retry=False; retryCount=0; legacy-peer-deps=False; elapsed=1.6512509s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Default deterministic npm install strategy.
- Source=deterministic-safety-fallback; strategy=normalInstall; command=`npm install --no-audit --no-fund --prefer-offline`; confidence=1; risk=low; fallback=True; retry=True; retryCount=0; legacy-peer-deps=False; elapsed=1.6221045s; failure=peerDependencyConflict; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Default deterministic npm install strategy.
- Source=deterministic-safety-fallback; strategy=legacyPeerDepsInstall; command=`npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline`; confidence=1; risk=medium; fallback=True; retry=True; retryCount=1; legacy-peer-deps=True; elapsed=269.3471337s; aiUsed=True; aiAccepted=False; aiRejected=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; manualActionRequired=False; reason=Previous npm install failed with a peer dependency conflict and legacy peer deps fallback is enabled.

## Peer Dependency Conflicts
- Angular 15 -> 16: package=@angular/common; requiredRange=^13.0.0; planned=^16.0.0; installed=16.2.12; requiredBy=@angular-slider/ngx-slider@13.0.0; classification=thirdPartyPeerConflict; decision=legacyPeerDepsFallback
- Angular 16 -> 17: package=zone.js; requiredRange=~0.14.0; planned=~0.13.3; installed=0.13.3; requiredBy=@angular/core@17.3.12; classification=angularRuntimeMismatch; decision=revisePackagePlan
- Angular 16 -> 17: package=@angular/common; requiredRange=^13.0.0; planned=^17.0.0; installed=17.3.12; requiredBy=@angular-slider/ngx-slider@13.0.0; classification=thirdPartyPeerConflict; decision=legacyPeerDepsFallback

## Install Strategy Summary
- Angular 15 -> 16: AI install strategy used=True; AI install strategy accepted=False; AI install strategy rejected reason=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; transient network retries used=0; peer dependency fallback used=True; manual action required=False
- Angular 16 -> 17: AI install strategy used=True; AI install strategy accepted=False; AI install strategy rejected reason=codex did not return strict JSON. Raw output saved to codex_raw_output.txt; transient network retries used=0; peer dependency fallback used=True; manual action required=False

## Command Failure Classification
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- buildFailed: Build verification command returned a non-zero exit code. Suggestion: Fix the build errors before continuing to the next Angular hop.
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.
- npm peer dependency conflict: npm reported a peer dependency conflict. Suggestion: Retry with a validated legacyPeerDeps strategy or remediate the conflicting package.

## Dependency Changes
- Managed by AI package categorisation and safety-checked package.json updates.

## Structural File Changes
- package-lock.json
- package.json
- tsconfig.json

## Validation Results
- Angular 15 -> 16: passed=true
- Angular 16 -> 17: passed=true

## Optional Angular Migrations
- None

## Manual Actions Required
- None

## Failures / Manual Actions Required
- None
- Rollback mode: manual
- Automatic rollback applied: False
