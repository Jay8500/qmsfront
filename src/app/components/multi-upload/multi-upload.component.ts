import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { log } from 'console';
// import { environment } from '../../../environments/environment';
// import { ApiService } from '../../service/api.service';
// import { NotificationService } from '../../service/notification.service';

export interface UploadedDocument {
  id?: number;
  filename: string;
  filesize: number;
  document_type: string;
  file?: File; // actual file
  url?: string; // blob url or path
  upload_by?: {
    id: number;
    loginname: string;
    email: string;
    // add other fields if needed
  };
  role?: string;
  upload_date?:string
}

@Component({
    selector: 'app-multi-upload',
    templateUrl: './multi-upload.component.html',
    styleUrls: ['./multi-upload.component.scss'],
    standalone: false
})
export class MultiUploadComponent implements OnInit {

  constructor( ) {
    this.fetchUsersAndDetails();
  }

  ngOnInit(): void {
    console.log('documents',this.documents);
    this.configlist();

  }
  @Input() documents: UploadedDocument[] = [];
   @Input() hideupload: boolean = false;
   @Input() hideview: boolean = false;
  @Output() documentsChange = new EventEmitter<UploadedDocument[]>();
  @Output() deleteEvent = new EventEmitter<string>();
  @Output() onView = new EventEmitter<UploadedDocument>();
  @Output() onDownload = new EventEmitter<UploadedDocument>();

   mimeTypeMap: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (DOCX)',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (XLSX)',
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
  };

  config_list:any
  configlist(){
    // this.api.getAPI(environment.API_URL + 'api/configuration/config/list').subscribe((res) => {
    //   console.log('config_list', res);
    //   if (res.status == environment.SUCCESS_CODE) {
    //     this.config_list = res.data;
    //     console.log('config_list', this.config_list);
    //   } else {
    //     console.log(res.message);

    //   }
    // });
  }
  getConfigValue(key: string): string {
    const config = this.config_list.find((item: any) => item.code === key);
    console.log("config for", key, config);
    return config?.value || '';
  }

  // handleFileInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   const MAX_FILE_SIZE_MB = 5;
  //   const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  //   const MAX_TOTAL_FILES = 5;
  //   const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx','xls', 'xlsx','csv', 'png', 'jpeg', 'jpg'];

  //   if (input.files && input.files.length > 0) {
  //     const validFiles: File[] = [];
  //     const invalidSizeFiles: string[] = [];
  //     const invalidTypeFiles: string[] = [];
  //     const currentFileCount = this.selectedFiles?.length || 0;
  //     const filesArray = Array.from(input.files);

  //     for (const file of filesArray) {
  //       const extension = file.name.split('.').pop()?.toLowerCase() || '';

  //       if (!ALLOWED_EXTENSIONS.includes(extension)) {
  //         invalidTypeFiles.push(file.name);
  //         continue;
  //       }

  //       if (file.size > MAX_FILE_SIZE_BYTES) {
  //         invalidSizeFiles.push(file.name);
  //         continue;
  //       }

  //       if (currentFileCount + validFiles.length >= MAX_TOTAL_FILES) {
  //         this.notification.showError(`Maximum of ${MAX_TOTAL_FILES} files can be uploaded.`);
  //         break;
  //       }

  //       validFiles.push(file);
  //     }

  //     if (invalidSizeFiles.length > 0) {
  //       this.notification.showError(`The following file(s) exceed the ${MAX_FILE_SIZE_MB}MB limit:\n${invalidSizeFiles.join('\n')}`);
  //     }

  //     if (invalidTypeFiles.length > 0) {
  //       this.notification.showError(`The following file(s) have unsupported file types:\n${invalidTypeFiles.join('\n')}`);
  //     }

  //     this.selectedFiles = [...(this.selectedFiles || []), ...validFiles];

  //     this.documents.push(...validFiles.map(file => ({
  //       filename: file.name,
  //       filesize: file.size,
  //       document_type: file.type,
  //       file,
  //       url: URL.createObjectURL(file)
  //     })));

  //     console.log('multidocuments', this.documents);
  //     this.documentsChange.emit(this.documents);
  //     this.filesSelected.emit(this.selectedFiles);
  //   }
  // }

  handleFileInput(event: Event) {
    if (!this.config_list || this.config_list.length === 0) {
      // this.notification.showError('Configuration not loaded yet. Please try again in a moment.');
      return;
    }
    const input = event.target as HTMLInputElement;

    const allowedExtensions = this.getConfigValue('DOC-TYPE')
      .split(',')
      .map(ext => ext.trim().replace('.', '').toLowerCase());

    const maxFileSizeMB = parseFloat(this.getConfigValue('DOC-SIZE'));
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const maxTotalFiles = parseInt(this.getConfigValue('DOC-LIMIT'));
    console.log('allowedExtensions', allowedExtensions);
    console.log('maxFileSizeMB', maxFileSizeMB);
    console.log('maxFileSizeBytes', maxFileSizeBytes);
    console.log('maxTotalFiles', maxTotalFiles);

    if (input.files && input.files.length > 0) {
      const validFiles: File[] = [];
      const invalidSizeFiles: string[] = [];
      const invalidTypeFiles: string[] = [];

      const currentFileCount = this.selectedFiles?.length || 0;
      const filesArray = Array.from(input.files);

      for (const file of filesArray) {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        if (!allowedExtensions.includes(extension)) {
          invalidTypeFiles.push(file.name);
          continue;
        }

        if (file.size > maxFileSizeBytes) {
          invalidSizeFiles.push(file.name);
          continue;
        }

        if (currentFileCount + validFiles.length >= maxTotalFiles) {
          // this.notification.showError(`Maximum of ${maxTotalFiles} files can be uploaded.`);
          break;
        }

        validFiles.push(file);
      }

      if (invalidSizeFiles.length > 0) {
        // this.notification.showError(
        //   `The following file(s) exceed the ${maxFileSizeMB}MB limit:\n${invalidSizeFiles.join('\n')}`
        // );
      }

      if (invalidTypeFiles.length > 0) {
        // this.notification.showError(
        //   `The following file(s) have unsupported file types:\n${invalidTypeFiles.join('\n')}`
        // );
      }

      this.selectedFiles = [...(this.selectedFiles || []), ...validFiles];

      this.documents.push(...validFiles.map(file => ({
        filename: file.name,
        filesize: file.size,
        document_type: file.type,
        file,
        url: URL.createObjectURL(file)
      })));

      this.documentsChange.emit(this.documents);
      this.filesSelected.emit(this.selectedFiles);
    }
  }



  @Output() filesSelected = new EventEmitter<File[]>();
  selectedFiles: File[] = [];

  onFilesSelect(event: any): void {
    const files = event.target.files;
    console.log('selected files', files);
    console.log('selected files1232', this.selectedFiles);
  }

  deleteDocument(index: any) {
    console.log('deleted document', index);

    this.documents = this.documents.filter((doc:any) => doc !== index);
    console.log('documents after deletion', this.documents);
    this.documentsChange.emit(this.documents);
    this.deleteEvent.emit(index);
    console.log(this.documents);
    this.selectedFiles = this.selectedFiles.filter((file: File) => file.name !== index.filename);

    this.filesSelected.emit(this.selectedFiles);

  }
  file_path = '/home/arivu/Documents/GitHub/HQMS_BACKEND'
  previewFile(doc: UploadedDocument) {
    console.log('preview file', doc);
    if (doc.id) {
      // console.log('Opening file from server:', environment.MEDIA_URL + doc.filename);
      // window.open(environment.MEDIA_URL + doc.filename, '_blank');
    } else {
      console.log('Opening local file:', doc.url);
      window.open(doc.url, '_blank');
    }
  }


  getFileName(path: string): string {
    if (!path) return '';
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1];
  }

  selectedUser: any;
  users: any[] = [];
  fetchUsersAndDetails() {

    // this.api.getAPI(environment.API_URL+'api/auth/users-list/').subscribe((res: { status: number; data: any[]; message: any; }) => {
    //   if (res.status === environment.SUCCESS_CODE) {
    //     this.users = res.data;
    //     console.log('User list:', this.users);

    //   }
    // });
  }

  updatename(userId: any): string {
    const user = this.users.find((item: any) => item?.id === parseInt(userId));
    return user ? user.loginname : 'Unknown';
  }


  formatSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
  }
}
