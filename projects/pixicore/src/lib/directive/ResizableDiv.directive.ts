import { Directive, Input, OnDestroy, ElementRef, NgZone, HostListener, HostBinding, OnInit, OnChanges } from '@angular/core';
import { SubscribableComponent } from '@sg/shared';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Directive({
  selector: '[resizablediv]'
})
export class ResizableDivDirective implements OnInit, OnDestroy, OnChanges {
  @Input() width: string = "0";
  @Input() height: string = "0";

  _keepAspectRatio = true;
  _disableResizing = false;
  subscription = new Subscription();

  private reqAR: number [] = [];
  cssClass: any = null;
  protected _elementClass: string[] = [];

  get keepAspectRatio(): boolean {
    return this._keepAspectRatio;
  }

  @Input() set keepAspectRatio(val: boolean) {
    this._keepAspectRatio = val;
    this.handleResize();
  }

  get disableResizing(): boolean {
    return this._disableResizing;
  }

  @Input() set disableResizing(val: boolean) {
    this._disableResizing = val;
    this.handleResize();
  }

  constructor(
      private elementRef: ElementRef,
      private zone: NgZone
    )
  {
  }

  ngOnInit(): void {
    this.reqAR = this.getAspectRatio(+this.width, +this.height);
    // this.addClass();
    this.handleResize();
  }

  ngOnChanges(): void {
    this.handleResize();
  }

  @Input('class')
  @HostBinding('class')
  get elementClass(): string {
      return this._elementClass.join(' ');
  }
  set elementClass(val: string) {
      this._elementClass = val.split(' ');
  }

  removeClass(): void {
    const index = this._elementClass.indexOf('resizable-class');
    if (index >= 0) {
      this._elementClass.splice(index, 1);
    }
  }
  @HostListener('window:resize', ['$event'])
  public onResize(event: any): void {
    this.zone.run(() => this.handleResize());
  }

  addClass(): void {
    this.cssClass = document.createElement('style');
    this.cssClass.type = 'text/css';
    this.cssClass.innerHTML = '.resizable-class { }';
    this.elementRef.nativeElement.appendChild(this.cssClass);
  }

  public resetSize(): void {
    this.elementRef.nativeElement.style.width = '';
    this.elementRef.nativeElement.style.height = '';
    this.elementRef.nativeElement.style.transform = '';
  }

  public handleResize(): void {
    this.resetSize();

    if(this._disableResizing) {
      // this.elementRef.nativeElement.style.width = '100vw';
      // this.elementRef.nativeElement.style.height = '100vh';
      return;
    }
    const parent = this.elementRef.nativeElement.parentElement.getBoundingClientRect();
    // const parentWidth = parent.offsetWidth;
    // const parentHeight = parent.offsetHeight;
    const parentWidth = parent.width;
    const parentHeight = parent.height;

    if (parentWidth === 0 || parentHeight === 0) {
      this.subscription.add(interval(100).pipe(take(1)).subscribe(() => this.handleResize()));
      return;
    }

    console.log(`[ResizableDiv : parent ${parentWidth}-${parentHeight}, required : ${this.width}-${this.height}]`);
    if (parentWidth !== this.width) {
      this.elementRef.nativeElement.style.width = this.width.toString() + 'px';
      this.elementRef.nativeElement.style.height = this.height.toString() + 'px';
      const scaleXUnits: number = parentWidth / +this.width;
      const scaleYUnits: number = parentHeight / +this.height;
      this.scale(scaleXUnits, scaleYUnits);
      this._elementClass.unshift('resizable-class');
    }else {
      this.removeClass();
    }
  }


  private scale(scaleXUnits: number, scaleYUnits: number): void {
    if (this.keepAspectRatio) {
      const scaleUnits = scaleXUnits > scaleYUnits ? scaleYUnits : scaleXUnits;
      scaleXUnits = scaleUnits;
      scaleYUnits = scaleUnits;
    }

    console.log(`[ResizableDiv : scaleX ${scaleXUnits} scaleY ${scaleYUnits}]`);
    const scale = `scaleX( ${scaleXUnits.toString()} ) scaleY( ${scaleYUnits.toString()} )`;
    this.elementRef.nativeElement.style.transform = scale;
    // this.elementRef.nativeElement.style.transformOrigin = 'left center';
  }

  gcd(a: number, b: number): number {
    if (b === 0) {
      return a;
    }
    return this.gcd(b, a % b);
  }
  getAspectRatio(width: number, height: number): number[] {
    const aspectRatio: number[] = [];
    const gcd = this.gcd(width, height);
    aspectRatio[0] = width / gcd;
    aspectRatio[1] = height / gcd;

    return aspectRatio;
  }

  public isSameAspectRatio(): boolean {
    const screenAspectRatio: number[] = this.getAspectRatio(screen.width, screen.height);

    return screenAspectRatio.length === this.reqAR.length &&
           screenAspectRatio.length === 2 &&
           screenAspectRatio[0] === this.reqAR[0] &&
           screenAspectRatio[1] === this.reqAR[1];
  }

  setAspectRatio(): void {

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
