import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiUploadComponent } from './multi-upload.component';

@NgModule({
  declarations: [MultiUploadComponent],
  imports: [CommonModule],
  exports: [MultiUploadComponent] // Export the component for use in other modules
})
export class MultiUploadModule {}
