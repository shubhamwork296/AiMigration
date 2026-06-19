import { Component, Injector } from '@angular/core';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import { Subscription } from 'rxjs';
import { VatResponseDTO } from 'src/app/models/account/my-bookings.model';
import { SharedService } from 'src/app/services/shared-sibling.service';

@Component({
    selector: "app-vat-receipt-pdf",
    templateUrl: "./vat-receipt-pdf.component.html",
    styleUrls: ["./vat-receipt-pdf.component.css"],
    standalone: false
})

export class VatReceiptPdfComponent {
  sharedService: SharedService;
  vatReceiptResponse: VatResponseDTO;
  setTimeoutId = null;
  subscription : Subscription;
  subscriptionCount = 0;
  constructor(private readonly injector: Injector){
    this.sharedService = this.injector.get(SharedService);
    this.subscription = this.sharedService.getValueWhenClickOnDownloadVatReceiptBtn().subscribe(value => {
      if(value){
        if(this.subscriptionCount == 0){
          this.subscriptionCount = ++this.subscriptionCount;
          this.vatReceiptResponse = value;
          this.convetToPDF();
        }
      }
    });
  }

  convetToPDF() {
    this.setTimeoutId = setTimeout(() => {
      let data = document.getElementById("contentToConvert");
        html2canvas(data).then((canvas) => {
          let imgWidth = 170;
          let imgHeight = (canvas.height * imgWidth) / canvas.width;
    
          const contentDataURL = canvas.toDataURL("image/png");
          let pdf = new jspdf("p", "mm", "a4"); // A4 size page of PDF
          // let position = 0;
          // let margin = {top: 10, right: 20, bottom: 10, left: 20};
          pdf.addImage(contentDataURL, "PNG", 19.5,8, imgWidth, imgHeight);
          pdf.save("VAT_Receipt.pdf"); // Generated PDF
          this.subscriptionCount = 0;
      });
    },1000);
  }

  ngOnDestroy(){
    if(this.setTimeoutId){
      clearTimeout(this.setTimeoutId);
    }
    this.subscription.unsubscribe();
  }
}
