import { Directive, HostListener, Output, EventEmitter, Injector } from "@angular/core";
import { SharedService } from "../services/shared-sibling.service";
import { AppConstantsService } from "./app-constants.service";

@Directive({
    selector: '[capsLockDetect]',
    standalone: false
})
export class CapsLockDetectDirective {
    @Output() capsLockOn = new EventEmitter<number>();
    capslock: number = 0;
    appConstantsService: AppConstantsService;
    constructor(private readonly sharedService: SharedService, private readonly injector: Injector) {
        this.appConstantsService = this.injector.get(AppConstantsService);
    }

    @HostListener('window:keyup', ['$event'])
    @HostListener('window:click', ['$event'])
    onEvent(event): void {
        if (event.key !== this.appConstantsService.capsLock) {
            if (event.getModifierState(this.appConstantsService.capsLock)) {
                this.sharedService.capsLockOn.emit({ value: 1, id: event.target.id })
                this.capslock = 1;
            } else {
                this.sharedService.capsLockOn.emit({ value: 2, id: event.target.id });
                this.capslock = 2;
            }
        } else if (event.key === this.appConstantsService.capsLock && this.capslock !== 0) {
            if (this.capslock === 1) {
                this.sharedService.capsLockOn.emit({ value: 2, id: event.target.id });
                this.capslock = 2;
            } else {
                this.sharedService.capsLockOn.emit({ value: 1, id: event.target.id });
                this.capslock = 1;
            }
        }
    }
}