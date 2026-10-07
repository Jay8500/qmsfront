import { Directive,ElementRef,HostListener } from '@angular/core';
@Directive({
  selector: '[appNospaces]',
  standalone:true
})
export class NospacesDirective {

  constructor(private el:ElementRef<HTMLInputElement|HTMLTextAreaElement>) { }
  @HostListener('beforeinput',['$event'])
    onBeforeInput(event:InputEvent):void{
    if(event.inputType!=='insertText'|| event.data!==' ')return;
    const input=this.el.nativeElement;
    const caret=input.selectionStart??input.value.length;
    const charBeforeCaret=input.value.charAt(caret-1);
    if(caret===0 || charBeforeCaret===" "){
      event.preventDefault()
    }
  }
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
     let cleaned=pasted.replace(/ {2,}/g,' ');
     if(before.endsWith(' ')) cleaned=cleaned.replace(/^ +/,'');
     if(after.startsWith(' ')) cleaned=cleaned.replace(/ +$/,'');
     const caretBeforeStrip=(before+cleaned).length;
     let merged=before+cleaned+after;
     const strippedLeading=merged.length-merged.replace(/^ +/,'').length;
     merged=merged.replace(/^ +/,'')
     input.value=merged;
     const newCaret=Math.max(0,caretBeforeStrip-strippedLeading);
     input.setSelectionRange(newCaret,newCaret);
     input.dispatchEvent(new Event('input',{bubbles:true}))
  }

}
