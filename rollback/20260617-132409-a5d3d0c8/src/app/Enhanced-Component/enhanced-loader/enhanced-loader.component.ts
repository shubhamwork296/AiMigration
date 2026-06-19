import { Component, Input, OnInit } from "@angular/core";

@Component({
    selector: 'app-enhanced-loader',
    templateUrl: './enhanced-loader.component.html',
    styleUrls: ['./enhanced-loader.component.css'],
    standalone: false
})

export class EnhancedCommonLoaderComponent {
    @Input() loaderHeading: string = '';
    @Input() loaderDescription: string = '';
    @Input() isLoaderActive : boolean = false;
    @Input() isPaymentAPICall: boolean = false;
}