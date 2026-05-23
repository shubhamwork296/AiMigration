import { Component, OnInit } from '@angular/core';
import { AttributeMasterService } from 'src/app/core/service/attribute-master.service';
import { Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ImageViewMasterService } from 'src/app/core/service/image-view-master.service';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { permissionTask } from 'src/app/core/constants/permission-enum';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-image-view-master',
  templateUrl: './image-view-master.component.html',
  styleUrls: ['./image-view-master.component.scss']
})
export class ImageViewMasterComponent implements OnInit {

  imageViewData: any = []
  search_text: string = ''
  search_status: any = -1
  modelChanged: Subject<string> = new Subject<string>();
  itemsPerPage: number = 10
  imageViewsCount: any
  page: number = 1
  AppConstants: any = AppConstants
  permissionTask: any = permissionTask

  constructor(
    private attributeMasterService: AttributeMasterService,
    private router: Router,
    private toastr: ToastrManager,
    private modalService: BsModalService,
    private imageViewMasterService: ImageViewMasterService,
    private httpService: HttpService
  ) {
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe(_searchText => {
        this.page = 1
        this.getImageViewList()
      });
  }

  ngOnInit(): void {
    this.httpService.getConfig().subscribe((config) => {
      this.itemsPerPage = config.itemPerPage;
    });
    this.getImageViewList();
  }

  getImageViewList() {
    let request = {
      "page": this.page,
      "perPage": this.itemsPerPage,
      "search": this.search_text,
      "isActive": this.search_status
    }
    this.attributeMasterService.imageViewList(request).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.imageViewData = response?.data?.imageViews
        this.imageViewsCount = response?.data?.imageViewsCount
      } else {
        this.imageViewData = []
      }
    })
  }

  editImageView(imageViewId: any) {
    this.router.navigate(['/admin/image-view-master/edit-image-view'], { queryParams: { id: imageViewId } })
  }

  deleteImageView(image_view_id: any, image_view_name: any) {
    let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
      class: 'modal-sm'
    });
    modalRef.content.mainHeading = AppConstants.DELETE_IMAGEVIEW;
    modalRef.content.subHeading = AppConstants.CONFIRM_DELETE_IMAGEVIEW;
    modalRef.content.buttonHeading1 = AppConstants.YES;
    modalRef.content.buttonHeading2 = AppConstants.NO;
    modalRef.content.title = image_view_name;
    modalRef.content.OnClose.subscribe((result: any) => {
      if (result == AppConstants.YES) {
        this.imageViewMasterService.deleteImageView({ imageViewId: image_view_id }).subscribe(response => {
          if (response && response.type == AppConstants.success) {
            let index = this.imageViewData.findIndex((x: any) => x.ImageViewId == image_view_id);
            this.imageViewData.splice(index, 1)
            this.toastr.successToastr(AppConstants.IMAGE_VIEW_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          } else {
            this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
        })
      }
    });
  }

  searchByName(_value: any) {
    this.page = 1
    this.getImageViewList()
  }

  searchByStatus(_value: any) {
    this.page = 1
    this.getImageViewList()
  }

  prodcut_search(event: any) {
    this.modelChanged.next(event.target.value);
  }

  pageChanged(event: any) {
    this.page = event
    this.getImageViewList()
  }

  dropTable(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.imageViewData, event.previousIndex, event.currentIndex);
    let update_Image_order: any = []
    this.imageViewData?.forEach((element: any) => {
      update_Image_order.push({
        imageViewId: element?.ImageViewId,
      })
    });
    this.updateOrder(update_Image_order)
  }

  updateOrder(image_order: any) {
    let request = {
      "imageViewArray": image_order
    }
    this.imageViewMasterService.ImageViewOrder(request).subscribe((response: any) => {
      if (response && response?.type == AppConstants.success) {
        return;
      }
    });
  }
}
