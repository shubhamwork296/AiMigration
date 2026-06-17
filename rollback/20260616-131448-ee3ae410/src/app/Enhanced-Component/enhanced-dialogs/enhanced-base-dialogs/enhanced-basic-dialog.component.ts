import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from "@angular/core";

@Component({
  selector: "app-enhanced-basic-dialog",
  templateUrl: "./enhanced-basic-dialog.component.html",
  styleUrls: ["./enhanced-basic-dialog.component.css"]
})

export class EnhancedBasicDialogComponent implements OnInit{
    @Input()
    public dialogFooter: TemplateRef<any>;

    @Input()
    public dialogTitle: string;
    
    @Output()
    public onComplete: EventEmitter<any> = new EventEmitter<any>(true);

    @Input()
    public buttonCancel: string | TemplateRef<any>;
  
    @Input()
    public buttonAcceptTitle: string;

    @Input()
    public isFooter: boolean = true;

    @Input()
    public iconClose: boolean = true;

    @Input() public showIdleTimer: string;

    constructor(){
        console.log('constructor');
    }
    ngOnInit(): void {
        console.log('on init');
    }

    public handleCancel() {
        this.onComplete.emit(false);
    }

    public handleAccept() {
        this.onComplete.emit(true);
    }

    public cancelButtonType() {
        if (this.buttonCancel instanceof TemplateRef) {
            return 'template';
        }
        return 'string';
    }
}