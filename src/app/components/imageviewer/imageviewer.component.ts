import { Component, ViewChild, ElementRef, Input,inject } from '@angular/core';
import { NgImageViewerComponent } from '../ngimageviewer/ngimageviewer.component';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
@Component({
  selector: 'hqms-imgviewer',
  templateUrl: './imageviewer.component.html',
  imports:[CommonModule,NgImageViewerComponent,NgxExtendedPdfViewerModule]
})
export class ImageViewerComponent {
  @ViewChild('ngImageViewer',{static :false}) ngImageViewer!: NgImageViewerComponent;
  @ViewChild("videoPlayer") videoplayer!: ElementRef;
  @ViewChild("audioPlayer") audioPlayer!: ElementRef;
  public santizer = inject(DomSanitizer)

  public docType = '';
  public imageSrc: any = "";
  @Input() showDownload = false;
  @Input() zoom = 'page-fit';
  public downloadFileName: string = ""
  public showPdfPrint = false;
  public officePreview = true;
  public viewer: any = 'office';
  public safePDFUrl:SafeResourceUrl|undefined;
  async showImage(fileContent: any, mimeType: string, isBlob?: boolean,

    showDownload?: boolean, fileName?: string,
    showPrint?: boolean, showPdfAsJpg?: boolean) {
    this.docType = '';
    if (fileContent == null) return;
    this.showDownload = (showDownload == null || showDownload == undefined ? true : showDownload);
    if (isBlob == null || isBlob == undefined) isBlob = true;

    if (mimeType.toUpperCase().indexOf("PDF") >= 0 || mimeType.toUpperCase().indexOf("KSWPS") >= 0)
      this.docType = 'pdf';
    else if (mimeType.toUpperCase().indexOf("VIDEO") >= 0)
      this.docType = 'video';
    else if (mimeType.toUpperCase().indexOf("AUDIO") >= 0)
      this.docType = 'audio';
    else if (mimeType.toUpperCase().indexOf("OFFICEDOCUMENT") >= 0
      || mimeType.toUpperCase().indexOf("MS-EXCEL") >= 0
      || mimeType.toUpperCase().indexOf("MSWORD") >= 0
      || mimeType.toUpperCase().indexOf("MS-POWERPOINT") >= 0)
      this.docType = 'office';
    else
      this.docType = 'jpg';

    showPdfAsJpg = showPdfAsJpg || false;
    if (this.docType == 'pdf' && showPdfAsJpg) this.docType = "jpg";

    if (showDownload) this.downloadFileName = fileName || "";
    switch (this.docType) {
      case "pdf":
        // this.imageSrc =  fileContent;
        this.safePDFUrl = fileContent;
        this.showPdfPrint = (showPrint || false);
        break;
      case "jpg":
        if (isBlob) {
          let render = new FileReader();
          render.readAsDataURL(fileContent);
          await render.addEventListener("load", async () => {
            let imgContent = await render.result!.toString();
            this.ngImageViewer.downloadFileName = fileContent.name;
            this.ngImageViewer.showImage(imgContent);
          }, false);
        }
        else {
           setTimeout(() => {
          this.ngImageViewer.showImage(fileContent);
          }, 1000);
        }
        break;
      case "video":
        setTimeout(() => {
          let videoUrl = (isBlob ? URL.createObjectURL(fileContent) : fileContent);
          this.videoplayer.nativeElement.src = videoUrl;
          this.videoplayer.nativeElement.play();
        }, 1000);
        break;
      case "audio":
        setTimeout(() => {
          let audioUrl = (isBlob ? URL.createObjectURL(fileContent) : fileContent);
          this.audioPlayer.nativeElement.src = audioUrl;
          this.audioPlayer.nativeElement.play();
        }, 1000);
        break;
      case "office":
        if (isBlob) {
          this.officePreview = false;
        }
        else {
          this.officePreview = true;
          this.imageSrc = fileContent;
        }
        break;
    }
  }
  imageCancel() {
    this.ngImageViewer.showImgCancel();
    this.downloadFileName = "";
    this.showDownload = false;
  }

  getSafeUrl(url:string):SafeResourceUrl{
  return this.santizer.bypassSecurityTrustResourceUrl(url)
  }
}