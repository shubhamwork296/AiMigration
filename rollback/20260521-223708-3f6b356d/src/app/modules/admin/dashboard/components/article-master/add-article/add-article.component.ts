import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
@Component({
  selector: 'app-add-article',
  templateUrl: './add-article.component.html',
  styleUrls: ['./add-article.component.scss']
})
export class AddArticleComponent implements OnInit {
  submitted: boolean = false;
  AddArticleForm!: FormGroup;
  id: any = 0
  AppConstants: any = AppConstants
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private articleMasterService: ArticleMasterService, private toastr: ToastrManager, private router: Router, private modalService: BsModalService) {
    this.route.queryParams.subscribe(params => {

      if (params['id']) {
        this.id = params['id']
      }
    });
    this.AddArticleForm = this.formBuilder.group({
      articleId: [this.id ? this.id : 0],
      articleName: ['', Validators.required],
      articleDescription: ['', Validators.required],
      isActive: [1, [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.id > 0) {
      this.getArticleList(this.id)
    }
  }

  // convenience getter for easy access to form fields
  get f() { return this.AddArticleForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.AddArticleForm.controls[controlName].hasError(errorName);
  }

  onSubmit() {
    this.submitted = true;
    this.AddArticleForm.controls['articleId'].setValue(this.id ? this.id : 0);
    if (this.AddArticleForm.invalid) {
      return;
    }
    if (this.id == 0) {
      let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
        class: 'modal-sm'
      });
      modalRef.content.mainHeading = AppConstants.ADD_ARTICLE;
      modalRef.content.subHeading = AppConstants.ADD_ARTICLE_CONFRIMATION;
      modalRef.content.buttonHeading1 = AppConstants.YES;
      modalRef.content.buttonHeading2 = AppConstants.NO;
      modalRef.content.OnClose.subscribe((result: any) => {
        if (result == AppConstants.YES) {
          this.addArticle()
        }
      });
    }else{
      this.addArticle()
    }
  }

  addArticle() {
    this.articleMasterService.addArticle(this.AddArticleForm.value).subscribe(res => {
      if (res && res?.type == AppConstants.success) {
        this.submitted = false;
        this.toastr.successToastr((this.id > 0 ? AppConstants.ARTICLE_UPDATE : AppConstants.ARTICLE_ADD), AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/article-master'])
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  getArticleList(id: any) {
    this.articleMasterService.articleList({ articleId: id, "search": '' }).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.AddArticleForm.controls['articleId'].setValue(response?.data?.articles[0].ArticleId);
        this.AddArticleForm.controls['articleName'].setValue(response?.data?.articles[0].ArticleName);
        this.AddArticleForm.controls['articleDescription'].setValue(response?.data?.articles[0].ArticleDescription);
        this.AddArticleForm.controls['isActive'].setValue(response?.data?.articles[0].IsActive);
      }
    })
  }

  cancel() {
    this.router.navigate(['/admin/article-master'])
  }
}
