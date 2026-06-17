import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CustomerServiceService } from 'src/app/services/customer-service.service';

@Component({
  selector: 'app-confirm-model',
  templateUrl: './confirm-model.component.html',
  styleUrls: ['./confirm-model.component.css']
})
export class ConfirmModelComponent {
  headerTitle: string = 'Account Closure';
  iconClose: boolean = true;
  constructor(private readonly customerServiceService: CustomerServiceService) { }

  closeAccount() {
    this.customerServiceService.logout('');
    window.location.href = environment.qttUrl;
  }
}
