import { Component ,inject} from '@angular/core';
import { Validations } from '../../../validations';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { HqmsService } from 'src/app/services/hqms.service';
@Component({
    selector: 'app-staff-competency-add',
    imports: [FormsModule],
    templateUrl: './staff-competency-add.component.html',
    styleUrl: './staff-competency-add.component.scss'
})
export class StaffCompetencyAddComponent {

  constructor(private location: Location,public _hqms:HqmsService) {}
  public validation=inject(Validations);
  // Employee Details
  selectedDepartment: string = '';
  selectedRole: string = '';
  selectedUnit: string = '';
  selectedEmployee: string = '';
  assessmentDuration: string = '30 Days';

  // Assessment Frequency
  firstAssessmentFrequency: string = '';
  firstAssessmentType: string = '';
  firstReviewer1: string = '';
  firstReviewer2: string = '';
  firstReviewer3: string = '';

  secondAssessmentFrequency: string = '';
  secondAssessmentType: string = '';
  secondReviewer1: string = '';
  secondReviewer2: string = '';
  secondReviewer3: string = '';

  annualAssessmentFrequency: string = '';
  annualAssessmentType: string = '';
  annualReviewer1: string = '';
  annualReviewer2: string = '';
  annualReviewer3: string = '';
 FORM_NAME="NEW_COMPETENCEY"


  // Dropdown options
  departments = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Emergency Medicine'
  ];

  roles = [
    'Doctor',
    'Nurse',
    'Technician',
    'Administrator',
    'Support Staff'
  ];

  units = [
    'ICU',
    'Emergency Room',
    'Operating Room',
    'Outpatient Clinic',
    'Laboratory'
  ];

  employees = [
    'John Doe (EMP001)',
    'Jane Smith (EMP002)',
    'Mike Johnson (EMP003)',
    'Sarah Wilson (EMP004)',
    'David Brown (EMP005)'
  ];

  assessmentTypes = [
    'Written Test',
    'Practical Assessment',
    'Oral Examination',
    'Skills Demonstration',
    'Peer Review'
  ];

  reviewers = [
    'Dr. Robert Chen',
    'Dr. Maria Garcia',
    'Dr. James Wilson',
    'Dr. Lisa Thompson',
    'Dr. Michael Davis'
  ];

  frequencyDays = [
    '7 Days',
    '15 Days',
    '30 Days',
    '60 Days',
    '90 Days'
  ];

  frequencyYears = [
    '1 Year',
    '2 Years',
    '3 Years',
    '5 Years'
  ];
  public errMsg:any={
    selectedDepartment:'',
    selectedRole:'',
    selectedUnit:'',
    selectedEmployee:'',
    assessmentDuration:'',
    firstAssessmentFrequency:'',
    firstAssessmentType:'',
    firstReviewer1:'',
    firstReviewer2:'',
    firstReviewer3:'',
    secondAssessmentFrequency:'',
    secondAssessmentType:'',
    secondReviewer1:'',
    secondReviewer2:'',
    secondReviewer3:'',
    annualAssessmentFrequency:'',
    annualAssessmentType:'',
    annualReviewer1:'',
    annualReviewer2:'',
    annualReviewer3:'',
  }
  public newCmptncy:any={
    selectedDepartment:null,
    selectedRole:null,
    selectedUnit:null,
    selectedEmployee:null,
    assessmentDuration:null,
    firstAssessmentFrequency:null,
    firstAssessmentType:null,
    firstReviewer1:null,
    firstReviewer2:null,
    firstReviewer3:null,
    secondAssessmentFrequency:null,
    secondAssessmentType:null,
    secondReviewer1:null,
    secondReviewer2:null,
    secondReviewer3:null,
    annualAssessmentFrequency:null,
    annualAssessmentType:null,
    annualReviewer1:null,
    annualReviewer2:null,
    annualReviewer3:null,
  }
  onGetErrMsg(ctrl){
  let result=this.validation.validateField(
         this.FORM_NAME,
         ctrl, this.newCmptncy[ctrl]
  )
  this.errMsg[ctrl]=result?.message || ''
  }

  clearForm() {
    // Reset all form fields
    this.selectedDepartment = '';
    this.selectedRole = '';
    this.selectedUnit = '';
    this.selectedEmployee = '';
    this.assessmentDuration = '30 Days';
    
    this.firstAssessmentFrequency = '';
    this.firstAssessmentType = '';
    this.firstReviewer1 = '';
    this.firstReviewer2 = '';
    this.firstReviewer3 = '';
    
    this.secondAssessmentFrequency = '';
    this.secondAssessmentType = '';
    this.secondReviewer1 = '';
    this.secondReviewer2 = '';
    this.secondReviewer3 = '';
    
    this.annualAssessmentFrequency = '';
    this.annualAssessmentType = '';
    this.annualReviewer1 = '';
    this.annualReviewer2 = '';
    this.annualReviewer3 = '';

  }

  submitForm() {
    Object.keys(this.errMsg).forEach((ctrl)=>{this.onGetErrMsg(ctrl)})
    let isValid=this._hqms.showErrorSummary(this.errMsg)
    if(isValid){
      this._hqms.hqmsToasterService({
        key: 'prem',
        severity: 'warn',
        summary: 'oppe doctors',
        detail: 'Check the errors',
      });
      return;
    };
    // Handle form submission
    console.log('Form submitted:', {
      employeeDetails: {
        department: this.selectedDepartment,
        role: this.selectedRole,
        unit: this.selectedUnit,
        employee: this.selectedEmployee,
        duration: this.assessmentDuration
      },
      firstAssessment: {
        frequency: this.firstAssessmentFrequency,
        type: this.firstAssessmentType,
        reviewers: [this.firstReviewer1, this.firstReviewer2, this.firstReviewer3]
      },
      secondAssessment: {
        frequency: this.secondAssessmentFrequency,
        type: this.secondAssessmentType,
        reviewers: [this.secondReviewer1, this.secondReviewer2, this.secondReviewer3]
      },
      annualAssessment: {
        frequency: this.annualAssessmentFrequency,
        type: this.annualAssessmentType,
        reviewers: [this.annualReviewer1, this.annualReviewer2, this.annualReviewer3]
      }
    });
  }

   goBack(): void {
    this.location.back();
  }
  
}
