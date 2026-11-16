import { ElementRef, SimpleChange } from '@angular/core';
import { vi } from 'vitest';
import { ScrollToActiveDirective } from './scroll-to-active-directive';

describe('ScrollToActiveDirective', () => {
  it('should create an instance', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    const directive = new ScrollToActiveDirective(mockElementRef);
    expect(directive).toBeTruthy();
  });

  it('should call scrollIntoView when isActive changes to true', () => {
    const div = document.createElement('div');
    const scrollSpy = vi.fn();
    div.scrollIntoView = scrollSpy;
    const directive = new ScrollToActiveDirective(new ElementRef(div));

    directive.isActive = true;
    directive.ngOnChanges({
      isActive: new SimpleChange(false, true, false),
    });

    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  });

  it('should not call scrollIntoView when isActive is false', () => {
    const div = document.createElement('div');
    const scrollSpy = vi.fn();
    div.scrollIntoView = scrollSpy;
    const directive = new ScrollToActiveDirective(new ElementRef(div));

    directive.isActive = false;
    directive.ngOnChanges({
      isActive: new SimpleChange(true, false, false),
    });

    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
