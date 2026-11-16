import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appScrollToActive]',
  standalone: true,
})
export class ScrollToActiveDirective implements OnChanges {
  @Input('appScrollToActive') isActive = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isActive'] && this.isActive) {
      this.el.nativeElement.scrollIntoView?.({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }
}
