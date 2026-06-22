import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { SessionService } from 'src/app/core/service/session.service';
import { SessionKeys } from 'src/app/core/constants/session-keys';
import { AppConstants } from '../../core/constants/app-constants';
@Directive({
  selector: '[isAuthorize]'
})

export class AuthorizeDirective {
  constructor(private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef,
    private sessionService: SessionService) {
  }

  @Input() set isAuthorize(moduleName: string[]) {
    let modules : any = this.sessionService.getSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS) || [];
    let allowedModules = AppConstants.checkModulePermissions(moduleName,modules) 
    if (allowedModules && allowedModules.length > 0) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}