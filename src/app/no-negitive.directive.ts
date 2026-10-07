import { Directive,Input,ElementRef} from '@angular/core';

@Directive({
  selector: '[appNoNegitive]',
})
export class NoNegitiveDirective {
  @Input allowNegitive=false;
  @Input allowDecimal=false;

  constructor(private el:ElementRef<HTMLInputElement>) { }
  @HostListener('beforeinput',['$event'])
  onBeforeInput(event:InputEvent):void{
    if(event.inputType!=='insertText'|| event.data!)return;
    const input=this.el.nativeElement;
    const proposed=this.proposedValue(input,event.data);
    if(!this.pattern().test(proposed)){
      event.preventDefault()
    }

  }}
    @HostListener('paste',['$event'])
    onPaste(event:ClipboardEvent):void{
    const pasted=event.clipboardData?.getData('text') ?? '';
    if(!pasted)return;
    event.preventDefault();
    const input=this.el.nativeElement;
    const start=input.selectionStart??input.value.length;
     const end=input.selectionEnd??input.value.length;
     const before=input.value.slice(0,start);
     const after=input.value.slice(end);
     let allowedChars='0-9';
     if(this.allowNegitive) allowedChars+='\\-';
     if(this.allowDecimal) allowedChars+='\\.';
     let cleaned=pasted.replace(new RegExp())
    }
    }


}
