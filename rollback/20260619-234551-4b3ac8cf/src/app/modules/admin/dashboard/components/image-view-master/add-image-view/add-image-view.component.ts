import { Component, OnInit } from '@angular/core';
import {  FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { AttributeMasterService } from 'src/app/core/service/attribute-master.service';
import { ImageViewMasterService } from 'src/app/core/service/image-view-master.service';
@Component({
  selector: 'app-add-image-view',
  templateUrl: './add-image-view.component.html',
  styleUrls: ['./add-image-view.component.scss']
})
export class AddImageViewComponent implements OnInit {
  submitted: boolean = false;
  ImageViewForm!: FormGroup;
  id: any = 0
  attributeData: any = []
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private toastr: ToastrManager, private router: Router, private attributeMasterService: AttributeMasterService, private imageViewMasterService: ImageViewMasterService) {
    this.route.queryParams.subscribe(params => {

      if (params['id']) {
        this.id = params['id']
      }
    });
    this.ImageViewForm = this.formBuilder.group({
      imageViewId: [this.id ? this.id : 0],
      imageViewName: ['', Validators.required],
      isActive: [1, [Validators.required]]
    });
  }
  AppConstants : any  = AppConstants
  ngOnInit(): void {
    if (this.id > 0) {
      this.getImageViewList(this.id)
    }
  }
  // convenience getter for easy access to form fields
  get f() { return this.ImageViewForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.ImageViewForm.controls[controlName].hasError(errorName);
  }

  onSubmit() {
    this.submitted = true;
    this.ImageViewForm.controls['imageViewId'].setValue(this.id ? this.id : 0);
    if (this.ImageViewForm.invalid) {
      return;
    }

    this.imageViewMasterService.addImageView(this.ImageViewForm.value).subscribe((response: any) => {
      if (response && response?.type == AppConstants.success) {
        this.submitted = false;
        this.toastr.successToastr((this.id > 0 ? AppConstants.IMAGE_VIEW_UPDATE : AppConstants.IMAGE_VIEW_ADD), AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/image-view-master'])
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  cancel() {
    this.router.navigate(['/admin/image-view-master'])

  }

  getImageViewList(imageViewId: any) {
    this.attributeMasterService.imageViewList({ imageViewId: imageViewId, "search": '', }).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.ImageViewForm.controls['imageViewId'].setValue(response?.data?.imageViews[0].ImageViewId);
        this.ImageViewForm.controls['imageViewName'].setValue(response?.data?.imageViews[0].ImageViewName);
        this.ImageViewForm.controls['isActive'].setValue(response?.data?.imageViews[0].IsActive);
      }
    })
  }


} 
