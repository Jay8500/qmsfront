import { Component, ViewChild, ElementRef, Input, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
@Component({
  selector: 's-ngimageviewer',
  standalone:true,
  templateUrl: './ngimageviewer.component.html',
  imports : [CommonModule,SharedModule],
  styleUrls: ['./ngimageviewer.component.css']
})
export class NgImageViewerComponent   {
  @Input() src: string = "assets/images/login-bg.jpg";
  @Input() imageTitle: string = "Image Title";
  @Input() showDownload: boolean = true;
  @Input() downloadFileName: string = "";

  public httpClient = inject(HttpClient);
  public imageStyle: any = {};


  showImage(imageSrc: any) {
    this.src = imageSrc;
  }

  onDownloadClick() {
    this.httpClient
      .get(this.src, { responseType: "blob" as "json" })
      .subscribe((res: any) => {
        if (this.downloadFileName == "") {
          if (this.src.indexOf('data:image/') >= 0) {
            this.downloadFileName = "image";
          }
          else {
            this.downloadFileName = this.src.substr(this.src.lastIndexOf("/") + 1);
          }
        }
        this.downloadFileName = (this.downloadFileName.indexOf(".") < 0) ? `${this.downloadFileName}.${res.type.split('/')[1]}` : this.downloadFileName;

        const file = new Blob([res], { type: res.type });
        const blob = window.URL.createObjectURL(file);
        const link = document.createElement('a');
        document.body.append(link);
        link.href = blob;
        link.download = this.downloadFileName;
        link.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(blob);
          link.remove();
        }, 1000);
      });
  }
  showImgCancel() {
    this.src = "";
  }
}