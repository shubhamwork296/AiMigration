import { Component, EventEmitter, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SessionService } from 'src/app/core/service/session.service';

@Component({
  selector: 'app-ring-size-pop-up',
  templateUrl: './ring-size-pop-up.component.html',
  styleUrls: ['./ring-size-pop-up.component.scss']
})
export class RingSizePopUpComponent {
  attributeList: any;
  selected_ring_size_attribute_id: number = 0;
  isCollapsed: boolean = true;
  @Output() OnRingSizeSection = new EventEmitter<any>();


  constructor(public bsModalRef: BsModalRef, private sessionService: SessionService) { }

  public close() {
    this.bsModalRef.hide();
  }

  onSizeSelect(attribute: { AttributeId: number, AttributeDetailId: number, AttributeDetailValue: string }) {
    let seletedRingSize = {
      AttributeId: attribute.AttributeId,
      AttributeDetailId: attribute.AttributeDetailId,
      AttributeDetailValue: attribute.AttributeDetailValue
    };
    this.sessionService.fromCat.next(false);
    this.OnRingSizeSection.emit(seletedRingSize);
    this.bsModalRef.hide();
  }

  triggerCollapseAndScroll() {
    this.isCollapsed = !this.isCollapsed;

    if (!this.isCollapsed) {
      // Scroll after the DOM updates
      setTimeout(() => {
        const accordion = document.getElementById('accordion');
        if (accordion) {
          // Check if we're in an iframe
          const isInIframe = window.self !== window.top;

          if (isInIframe) {
            // For iframe, prevent parent scrolling by using container scroll
            const modalContainer = document.querySelector('.ringsize_modal') as HTMLElement;
            if (modalContainer) {
              const accordionRect = accordion.getBoundingClientRect();
              const containerRect = modalContainer.getBoundingClientRect();

              // Calculate scroll position relative to modal container
              const scrollTop = accordionRect.top - containerRect.top + modalContainer.scrollTop - 20;

              // Use smooth scrolling within the modal container
              modalContainer.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
              });
            } else {
              // Fallback: scroll accordion into view but constrain to iframe
              accordion.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest', // Use 'nearest' instead of 'start' for iframe
                inline: 'nearest'
              });
            }
          } else {
            // Normal behavior when not in iframe
            accordion.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }, 100);
    }
  }

}
