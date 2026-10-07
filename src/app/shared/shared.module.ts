import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ListboxModule } from 'primeng/listbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {BlockUIModule} from 'primeng/blockui'
import {DialogModule} from 'primeng/dialog';
import {ImageModule} from 'primeng/image';
import {TooltipModule} from 'primeng/tooltip';
// import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import {CsvDirective} from '../csv.directive';
import {PdfDirective} from '../pdf.directive';
import {AppDatePipe} from '../pipes/app-date.pipe';
import {ExcelDirective} from '../excel.directive';
import {NospacesDirective} from '../directives/nospaces.directive';
import {StepperModule} from 'primeng/stepper';
import {ChipModule} from 'primeng/chip';
import {SelectButtonModule} from 'primeng/selectbutton';
import {PickListModule} from 'primeng/picklist';
import {SkeletonModule} from 'primeng/skeleton';
import { DrawerModule}from 'primeng/drawer';
import {AvatarModule } from 'primeng/avatar';
import {PopoverModule } from 'primeng/popover';
import {AccessDirective } from '../smart/access.directive';
import {TabsModule} from 'primeng/tabs';
import { PanelModule} from 'primeng/panel';
import { FieldsetModule} from 'primeng/fieldset';
import { AutoFocusModule} from 'primeng/autofocus';
import { InputOtpModule} from 'primeng/inputotp';
import { MessageModule} from 'primeng/message';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    AutoCompleteModule,
    DatePickerModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    KeyFilterModule,
    ListboxModule,
    MultiSelectModule,
    PasswordModule,
    RadioButtonModule,
    ButtonModule,
    TagModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    BlockUIModule,
    DialogModule,
    InputGroupModule,
    InputGroupAddonModule,
    CsvDirective,
    PdfDirective,
    AppDatePipe,
    ExcelDirective,
    NospacesDirective,
    ImageModule,
    TooltipModule,
    StepperModule,
    ChipModule,
    SelectButtonModule,
    PickListModule,
    SkeletonModule,
    DrawerModule,
    AvatarModule,
    PopoverModule,
    AccessDirective,
    TabsModule,
    PanelModule,
    FieldsetModule,
    AutoFocusModule,
    InputOtpModule,
    MessageModule
  ],
  exports: [
    CommonModule,
    TableModule,
    AutoCompleteModule,
    DatePickerModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    KeyFilterModule,
    ListboxModule,
    MultiSelectModule,
    PasswordModule,
    RadioButtonModule,
    ButtonModule,
    TagModule,
    FormsModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    BlockUIModule,
    DialogModule,
    InputGroupModule,
    InputGroupAddonModule,
    CsvDirective,
    PdfDirective,
    ExcelDirective,
    NospacesDirective,
    ImageModule,
    TooltipModule,
    StepperModule,
    ChipModule,
    SelectButtonModule,
    PickListModule,
    SkeletonModule,
    DrawerModule,
    AvatarModule,
    PopoverModule,
    AccessDirective,
    TabsModule,
    PanelModule,
    FieldsetModule,
    AutoFocusModule,
    AppDatePipe,
    InputOtpModule,
    MessageModule
  ],
})
export class SharedModule { }
