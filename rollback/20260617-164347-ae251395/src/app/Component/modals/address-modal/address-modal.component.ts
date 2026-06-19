import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomerAddress, Address } from 'src/app/models/payment-details/billing-address-response.model';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';

@Component({
    selector: 'app-address-modal',
    templateUrl: './address-modal.component.html',
    styleUrls: ['./address-modal.component.css'],
    standalone: false
})
export class AddressModalComponent implements OnInit {

  constructor(private readonly formBuilder: FormBuilder, public dialogRef: MatDialogRef<AddressModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public notificationService: NotificationService) { }

  addressForm: FormGroup;
  address:CustomerAddress;
  addressList = ["postCode", "address1", "address2", "address3", "city", "country"]

  ngOnInit() {
    this.createAddress();

    if(this.data){
      this.initializeAddress();
    }
  }

  createAddress(){
    this.addressForm = this.formBuilder.group({
      address1: new FormControl(''),
      address2: new FormControl(''),
      address3: new FormControl(''),
      city: new FormControl(''),
      postCode: new FormControl(''),
      country: new FormControl('')
    });
  }

  initializeAddress(){
    this.addressForm.patchValue({
      address1: this.data.Address.Address1,
      address2: this.data.Address.Address2,
      address3: this.data.Address.Address3,
      city: this.data.Address.City,
      postCode: this.data.Address.PostCode,
      country: this.data.Address.Country
    });
  }

  onClose(){
    this.dialogRef.close();
  }

  onAddressCreated(){
    if(this.addressForm.valid)
    {
      this.addressList.forEach(x => {
        let elementValue = document.getElementById(x)['value'];
        const ctrlValue = this.addressForm.controls[x];
        ctrlValue.setValue(elementValue);
      });

      this.address = new CustomerAddress();
      this.address.Address = new Address();
      this.address.Address.Address1 = this.addressForm.get('address1').value;
      this.address.Address.Address2 = this.addressForm.get('address2').value;
      this.address.Address.Address3 = this.addressForm.get('address3').value;
      this.address.Address.PostCode = this.addressForm.get('postCode').value;
      this.address.Address.City = this.addressForm.get('city').value;
      this.address.Address.Country = this.addressForm.get('country').value;
      if(!this.data){
        this.address.AddressType = 'UNSPECIFIED';
        this.address.IsDefault = true;
        this.address.Address.CountryCode = "";
        this.dialogRef.close(this.address);
      }
      else{
        this.address.Address.CountryCode = this.data.Address.CountryCode;
        this.dialogRef.close(this.address.Address);
      }

    }
    else{
      this.notificationService.warn("Please fill all required data.");
    }
  }
}
