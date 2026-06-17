import {
  ChangeDetectionStrategy,
  signal,
  Component,
  Inject,
  OnInit,
  ViewEncapsulation,
  HostListener,
  Injector,
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { EnhancedRailCardStationModel } from "src/app/models/enhanced-mixing-deck/enhanced-railcard.model";
import { Subject, Subscription } from "rxjs";
import { EnhancedAccessbilityMessageEnum, EnhancedReviewBuyAndDeliveryBtnTextEnum } from "src/app/utility/app-constants.service";

@Component({
  selector: "enhanced-add-railcard-dialogs",
  templateUrl: "./enhanced-add-railcard-dialogs.component.html",
  styleUrls: ["./enhanced-add-railcard-dialogs.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
@HostListener("window:resize")
export class EnhancedAddRailcardDialogs implements OnInit {
  isMobile = false;
  headerTitle: string;
  readonly panelOpenState = signal(false);
  formbuilder: FormBuilder;
  // Adults
  value = 1;
  min = 0;
  max = 10;
  step = 1;
  railcardForm: FormGroup;
  railCardFormArray: FormArray;
  railcardCount = 0;
  railcardAdult = 0;
  railcardChild = 0;
  adultChildVisible = false;
  railCardValueChange = false;
  railCardModel : EnhancedRailCardStationModel[];
  public destroy$ = new Subject<void>();
  railCardValueChangeSub : Subscription;
  adultChildVisibleSub: Subscription;
  ariaPlusRailcardLabel = '';
  ariaMinusRailcardLabel = '';
  enhancedAccessbilityMessageEnum: EnhancedAccessbilityMessageEnum;
  quantityLiveMessage = '';
  isAdultInteracting = false;
  isChildInteracting = false;
  enhancedReviewBuyAndDeliveryBtnTextEnum: EnhancedReviewBuyAndDeliveryBtnTextEnum;
  

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EnhancedAddRailcardDialogs>,
    private readonly injector: Injector
  ) {
    this.formbuilder = this.injector.get(FormBuilder);
    this.enhancedAccessbilityMessageEnum = this.injector.get(EnhancedAccessbilityMessageEnum);
    this.enhancedReviewBuyAndDeliveryBtnTextEnum = this.injector.get(EnhancedReviewBuyAndDeliveryBtnTextEnum);
    console.log("constructor");
  }

  ngOnInit(): void {
    if(this.data){
    this.railcardForm = this.data.railcardForm;
    this.railCardModel = this.data.railCardsModel;
    this.railcardCount = this.data.railcardCount;
    this.railcardAdult = this.data.railcardAdult;
    this.railcardChild = this.data.railcardChild;
    this.adultChildVisible = this.data.adultChildVisible;
    this.railCardValueChangeSub = this.data.railCardValueChange$?.subscribe(value => {
      this.railCardValueChange = value;
    });
    this.railCardFormArray = this.data.railCardFormArray;
    }
    this.checkMobile();
    this.adultChildVisibleSub = this.data?.adultChildVisible$?.subscribe((visible) => {
      this.adultChildVisible = visible;
    });
  }

  get railcardFormGroup(): FormGroup {
    return this.railcardForm;
  }

  ngAfterViewInit(){
    this.railcardForm.get('railcardAdult').setErrors(null);
    this.railcardForm.get('railcardChild').setErrors(null);
  }
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
  // End Adults

  onRailcardChange(index){
    if(this.data?.onRailcardChange){
      this.data.onRailcardChange(index);
    }
  }

  decrementRailcardCount(){
    if(this.data?.onRailCardDecrement){
      this.data.onRailCardDecrement();
    }

      this.updateRailcardAriaOnClick(false);
  }

  incrementRailcardCount(){
    if(this.data?.onRailCardIncrement){
      this.data.onRailCardIncrement();
    }

     this.updateRailcardAriaOnClick(true);
  }

  incrementRailcardAdult(){
    try {
    this.isAdultInteracting = true;
    if(this.data?.incrementRailcardAdult){
      this.data.incrementRailcardAdult();
    }
    if (this.isRailcardMaxReached()) {
      this.quantityLiveMessage = `${this.enhancedAccessbilityMessageEnum.maxValueMsg}`;
    } else {
      let value = this.railcardForm.get('railcardAdult')?.value;
      this.quantityLiveMessage = `Adult ${value}`;
    }
    setTimeout(() => {
      this.isAdultInteracting = false;
    });
    } catch (error) { console.log(error);}
  }

  decrementRailcardAdult(){
    try {
    this.isAdultInteracting = true;
    if(this.data?.decrementRailcardAdult){
      this.data.decrementRailcardAdult();
    }
    let errors = this.railcardFormGroup.get("railcardAdult")?.errors;
    if (errors?.adultValidIn) {
      this.quantityLiveMessage = `${this.enhancedAccessbilityMessageEnum.adultMinValueMsg} ${errors.minValue} and ${errors.maxValue}.`;
    } else {
      let value = this.railcardForm.get('railcardAdult')?.value;
      this.quantityLiveMessage = `Adult ${value}`;
    }
    setTimeout(() => {
     this.isAdultInteracting = false;
    });
    } catch (error) { console.log(error);}
  }

  decrementRailcardChild(){
    try {
    this.isChildInteracting = true;
    if(this.data?.decrementRailcardChild){
      this.data.decrementRailcardChild();
    }
    let errors = this.railcardFormGroup.get("railcardChild")?.errors;
    if (errors?.childValidIn) {
      this.quantityLiveMessage = `${this.enhancedAccessbilityMessageEnum.childMinValueMsg} ${errors.minValue} and ${errors.maxValue}.`;
    } else {
      let value = this.railcardForm.get('railcardChild')?.value;
      this.quantityLiveMessage = `Child ${value}`;
    }
    setTimeout(() => {
     this.isChildInteracting = false;
    });
    } catch (error) { console.log(error);}
  }

  incrementRailcardChild(){
    try {
    this.isChildInteracting = true;
    if(this.data?.incrementRailcardChild){
      this.data.incrementRailcardChild();
    }
     if (this.isRailcardMaxReached()) {
      this.quantityLiveMessage = `${this.enhancedAccessbilityMessageEnum.maxValueMsg}`;
    } else {
      let value = this.railcardForm.get('railcardChild')?.value;
      this.quantityLiveMessage = `Child ${value}`;
    }
    setTimeout(() => {
     this.isChildInteracting = false;
    });
    } catch (error) { console.log(error);}
  }

  addRailcardToList(){
    if(this.data?.addRailcardToList){
      this.dialogRef.close();
      this.data.addRailcardToList();
    }
  }

  onCancelRailcard(){
    if(this.data?.onCancelRailcard){
      this.dialogRef.close();
      this.data.onCancelRailcard();
    }
  }

  ngOnDestroy(){
    this.railCardValueChangeSub.unsubscribe();
    this.adultChildVisibleSub.unsubscribe();
  }

  private getSelectedRailcardName(): string {
    let code = this.railcardForm.get("railcardName")?.value;
    if (!code) {
      return "railcard";
    }
    return this.railCardModel.find((r) => r.Code === code)?.Name ?? "railcard";
  }

  getRailcardQuantityAriaLabel(isIncrease: boolean): string {
    try {
    let value = this.railcardForm.get("railcardCount")?.value ?? 0;
    let name = this.getSelectedRailcardName();
    let action = isIncrease ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.increase}` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.decrease}`;
    let btn = isIncrease ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.plus}` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.minus}`;

    return `Quantity selector, current value: ${value}. Press ${btn} button to ${action} ${name}.`;
    } catch (error) { console.log(error); }
  }
  
  resetRailcardAria() {
    this.ariaPlusRailcardLabel = "";
    this.ariaMinusRailcardLabel = "";
  }
  
  updateRailcardAriaOnClick(isIncrease: boolean) {
    try {
    let current = this.railcardForm.get("railcardCount")?.value ?? 0;
    let name = this.getSelectedRailcardName();
    let announcement = "";

    if (current === this.min) {
      announcement = `${this.enhancedAccessbilityMessageEnum.minValueMsg}`;
    } else if (isIncrease && this.isRailcardMaxReached()) {
      announcement = `${this.enhancedAccessbilityMessageEnum.maxValueMsg}`;
    } else {
      announcement = `${name} ${current}`;
    }

    if (isIncrease) {
      this.ariaPlusRailcardLabel = announcement;
    } else {
      this.ariaMinusRailcardLabel = announcement;
    }
    } catch (error) { console.log(error); }
  }

  isRailcardMaxReached(): boolean {
    return !!(
      this.railcardForm.get('railcardAdult')?.errors?.adultValid ||
      this.railcardForm.get('railcardChild')?.errors?.childValid
    );
  }
  
  getQuantityFocusLabel(controlName: "railcardAdult" | "railcardChild", isIncrease: boolean): string {
    try {
      if (
        (controlName === "railcardAdult" && this.isAdultInteracting) ||
        (controlName === "railcardChild" && this.isChildInteracting)
      ) {
        return null; // aria-label removed during click
      }
      let value = this.data.railcardForm.get(controlName)?.value ?? 0;
      let action = isIncrease ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.plus}` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.minus}`;
      let verb = isIncrease ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.increase}` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.decrease}`;
      return `Quantity selector, current value: ${value}. Press ${action} button to ${verb}`;
    } catch (error) { console.log(error);}
  }


}
