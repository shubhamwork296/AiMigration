import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";


@Component({
  selector: "enhanced-logout-dialogs",
  templateUrl: "./enhanced-logout-dialogs.component.html",
  styleUrls: ['./enhanced-logout-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})





export class EnhancedLogoutDialogs implements OnInit{
    isMobile = false;
    headerTitle: string = `Logout`;
    isLoggedOut: boolean;
    readonly panelOpenState = signal(false);
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedLogoutDialogs> ){
    }
    
    ngOnInit(): void {
      this.checkMobile();
    }

    @HostListener('window:resize')
    onResize() {
      this.checkMobile();
    }

    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
    }

    onLogout(result) {
      this.isLoggedOut = result;
      this.dialogRef.close(this.isLoggedOut);
    }
}
