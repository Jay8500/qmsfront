import { Routes } from '@angular/router';
import { LoginComponent } from './authentication/login/login.component';
import {authGuard, permissionGuard} from './sec-featuers/auth.guard';
import {LayoutComponent} from './layout/layout.component'
export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    // Public page behind the vaccination certificate QR code (no login).
    {
        path: 'verify-certificate/:code',
        loadComponent: () => import('./vaccination-management/verify-certificate/verify-certificate.component').then(m => m.VerifyCertificateComponent)
    },
    {
        path: "",
        component : LayoutComponent,
        canMatch:[authGuard],
        canActivateChild:[permissionGuard],
        children: [
            {
                path: 'audits-dashboard',
                loadComponent: () => import('./audit-dashboard/audits-dashboard/audits-dashboard.component').then(m => m.AuditsDashboardComponent)
            },
            {
                path: 'audits-listing',
                loadComponent: () => import('./audit-dashboard/audits-listing/audits-listing.component').then(m => m.AuditsListingComponent)
            },
            {
                path: 'audits-details',
                loadComponent: () => import('./audit-dashboard/audits-details/audits-details.component').then(m => m.AuditsDetailsComponent)
            },
            {
                path: 'audit-master-dashboard',
                loadComponent: () => import('./audit-management/audit-master/audit-master-dashboard/audit-master-dashboard.component').then(m => m.AuditMasterDashboardComponent)
            },
            {
                path: 'create-audit',
                loadComponent: () => import('./audit-management/audit-master/create-audit/create-audit.component').then(m => m.CreateAuditComponent)
            },
            {
                path: 'schedule-audit-dashboard',
                loadComponent: () => import('./audit-management/schedule-audit/schedule-audit-dashboard/schedule-audit-dashboard.component').then(m => m.ScheduleAuditDashboardComponent)
            },
            {
                path: 'schedule-audit-add',
                loadComponent: () => import('./audit-management/schedule-audit/schedule-audit-add/schedule-audit-add.component').then(m => m.ScheduleAuditAddComponent)
            },
            {
                path: 'audit-reports-listing',
                loadComponent: () => import('./audit-management/audit-reports-listing/audit-reports-listing.component').then(m => m.AuditReportsListingComponent)
            },
            {
                path: 'audit-type-dashboard',
                loadComponent: () => import('./audit-management/audit-types/audit-type-dashboard/audit-type-dashboard.component').then(m => m.AuditTypeDashboardComponent)
            },
            // Incident Management
            {
                path: 'incident-dashboard',
                loadComponent: () => import('./incident-management/incident-dashboard/incident-dashboard.component').then(m => m.IncidentDashboardComponent)

            },
            // old static mock-up list -> the dashboard list (2026-10-07)
            { path: 'incident-listing', redirectTo: 'incident-dashboard', pathMatch: 'full' },
            {
                path: 'incident-rules',
                loadComponent: () => import('./incident-management/incident-rules/incident-rules.component').then(m => m.IncidentRulesComponent)
            },
            {
                path: 'incident-add',
                loadComponent: () => import('./incident-management/incident-add/incident-add.component').then(m => m.IncidentAddComponent)

            },
            {
                path: 'incident-details',
                loadComponent: () => import('./incident-management/incident-details/incident-details.component').then(m => m.IncidentDetailsComponent)
            },
            {
                path: 'investigation',
                loadComponent: () => import('./incident-management/investigation/investigation.component').then(m => m.InvestigationComponent)
            },
            {
                path: 'investigation-dashboard',
                loadComponent: () => import('./incident-management/investigation-dashboard/investigation-dashboard.component').then(m => m.InvestigationDashboardComponent)

            },
            // old empty placeholder -> My Investigations (Quality Team queue is there and on the dashboard)
            { path: 'quality-listing', redirectTo: 'investigation-dashboard', pathMatch: 'full' },
            // Risk Management
            {
                path: 'risk-dashboard',
                loadComponent: () => import('./risk-management/risk-dashboard/risk-dashboard.component').then(m => m.RiskDashboardComponent)
            },
            // old static mock-up list -> the risk register on the dashboard (2026-10-07)
            { path: 'risk-listing', redirectTo: 'risk-dashboard', pathMatch: 'full' },
            {
                path: 'risk-add',
                loadComponent: () => import('./risk-management/risk-add/risk-add.component').then(m => m.RiskAddComponent)
            },
            {
                path: 'risk-evaluation',
                loadComponent: () => import('./risk-management/riskevaluation/riskevaluation.component').then(m => m.RiskevaluationComponent)
            },
            {
                path: 'risk-review',
                loadComponent: () => import('./risk-management/riskqualityreview/riskqualityreview.component').then(m => m.RiskqualityreviewComponent)
            },
            {
                path: 'risk-details',
                loadComponent: () => import('./risk-management/risk-details/risk-details.component').then(m => m.RiskDetailsComponent)
            },
            // Feedback
            {
                path: 'prem-master-add',
                loadComponent: () => import('./feedback-management/prem/premmaster/premmaster.component').then(m => m.PremmasterComponent)
            },
            {
                path: 'prom-master-add',
                loadComponent: () => import('./feedback-management/prem/prommaster/prommaster.component').then(m => m.PrommasterComponent)
            },
            {
                path: 'prem-feedback',
                loadComponent: () => import('./feedback-management/prem/premfeedback/premfeedback.component').then(m => m.PremfeedbackComponent)
            },
            {
                path: 'prem-daily-feedback-listing',
                loadComponent: () => import('./feedback-management/prem/prem-daily-feedback-listing/prem-daily-feedback-listing.component').then(m => m.PremDailyFeedbackListingComponent)
            },
            {
                path: 'prem-discharge-feedback-listing',
                loadComponent: () => import('./feedback-management/prem/prem-discharge-feedback-listing/prem-discharge-feedback-listing.component').then(m => m.PremDischargeFeedbackListingComponent)
            },
            {
                path: 'prem-daily-feedback-details',
                loadComponent: () => import('./feedback-management/prem/prem-daily-feedback-details/prem-daily-feedback-details.component').then(m => m.PremDailyFeedbackDetailsComponent)
            },
            {
                path: 'prem-discharge-feedback-details',
                loadComponent: () => import('./feedback-management/prem/prem-discharge-feedback-details/prem-discharge-feedback-details.component').then(m => m.PremDischargeFeedbackDetailsComponent)
            },
            {
                path: 'prem-outpatint-feedback-listing',
                loadComponent: () => import('./feedback-management/prem/prem-outpatint-feedback-listing/prem-outpatint-feedback-listing.component').then(m => m.PremOutpatintFeedbackListingComponent)
            },
            {
                path: 'prem-outpatint-feedback-details',
                loadComponent: () => import('./feedback-management/prem/prem-outpatint-feedback-details/prem-outpatint-feedback-details.component').then(m => m.PremOutpatintFeedbackDetailsComponent)
            },
            {
                path: 'prom-dashboard',
                loadComponent: () => import('./feedback-management/prom/prom-dashboard/prom-dashboard.component').then(m => m.PromDashboardComponent)
            },
            {
                path: 'prom-listing',
                loadComponent: () => import('./feedback-management/prom/prom-listing/prom-listing.component').then(m => m.PromListingComponent)
            },
            {
                path: 'prom-add',
                loadComponent: () => import('./feedback-management/prom/prom-add/prom-add.component').then(m => m.PromAddComponent)
            },
            {
                path: 'care-continuity-master',
                loadComponent: () => import('./feedback-management/prom/carecontiuitymaster/carecontiuitymaster.component').then(m => m.CarecontiuitymasterComponent)
            },
            {
                path: 'prom-details',
                loadComponent: () => import('./feedback-management/prom/prom-details/prom-details.component').then(m => m.PromDetailsComponent)
            },
            {
                path: 'prom-overall-report',
                loadComponent: () => import('./feedback-management/prom/prom-overall-report/prom-overall-report.component').then(m => m.PromOverallReportComponent)
            },
            {
                path: 'employee-dashboard',
                loadComponent: () => import('./feedback-management/employee-survey/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent)
            },
            {
                path: 'employee-listing',
                loadComponent: () => import('./feedback-management/employee-survey/employee-listing/employee-listing.component').then(m => m.EmployeeListingComponent)
            },
            {
                path: 'employee-details',
                loadComponent: () => import('./feedback-management/employee-survey/employee-details/employee-details.component').then(m => m.EmployeeDetailsComponent)
            },
            {
                path: 'employee-survey-capa',
                loadComponent: () => import('./feedback-management/employee-survey/employee-survey-capa/employee-survey-capa.component').then(m => m.EmployeeSurveyCapaComponent)
            },
            {
                path: 'survey-response',
                loadComponent: () => import('./feedback-management/survey-response/survey-response.component').then(m => m.SurveyResponseComponent)
            },
            // Grievance Management
            {
                path: 'grievance-dashboard',
                loadComponent: () => import('./feedback-management/grievance-complaint-mangement/grievance-dashboard/grievance-dashboard.component').then(m => m.GrievanceDashboardComponent)
            },
            {
                path: 'grievance-listing',
                loadComponent: () => import('./feedback-management/grievance-complaint-mangement/grievance-listing/grievance-listing.component').then(m => m.GrievanceListingComponent)
            },
            {
                path: 'grievance-add',
                loadComponent: () => import('./feedback-management/grievance-complaint-mangement/grievance-add/grievance-add.component').then(m => m.GrievanceAddComponent)
            },
            {
                path: 'grievance-details',
                loadComponent: () => import('./feedback-management/grievance-complaint-mangement/grievance-details/grievance-details.component').then(m => m.GrievanceDetailsComponent)
            },
            // Clinical Pathway
            {
                path: 'clinical-dashboard',
                loadComponent: () => import('./patient-safety/clinical-pathway/clinical-dashboard/clinical-dashboard.component').then(m => m.ClinicalDashboardComponent)
            },
            {
                path: 'clinical-listing',
                loadComponent: () => import('./patient-safety/clinical-pathway/clinical-listing/clinical-listing.component').then(m => m.ClinicalListingComponent)
            },
            {
                path: 'clinical-details',
                loadComponent: () => import('./patient-safety/clinical-pathway/clinical-details/clinical-details.component').then(m => m.ClinicalDetailsComponent)
            },
            {
                path: 'new-audit',
                loadComponent: () => import('./patient-safety/clinical-pathway/new-audit/new-audit.component').then(m => m.NewAuditComponent)
            },
            // Patient Safety
            {
                path: 'safety-dashboard',
                loadComponent: () => import('./patient-safety/safety-check-survey/safety-dashboard/safety-dashboard.component').then(m => m.SafetyDashboardComponent)
            },
            {
                path: 'sc-feedback',
                loadComponent: () => import('./patient-safety/safety-check-survey/scsurvey/scsurvey.component').then(m => m.ScsurveyComponent)
            },
            {
                path: 'safety-details',
                loadComponent: () => import('./patient-safety/safety-check-survey/safety-details/safety-details.component').then(m => m.SafetyDetailsComponent)
            },
            {
                path: 'add-survey',
                loadComponent: () => import('./patient-safety/safety-check-survey/add-survey/add-survey.component').then(m => m.AddSurveyComponent)
            },
            {
                path: 'safety-details-capa',
                loadComponent: () => import('./patient-safety/safety-check-survey/safety-details-capa/safety-details-capa.component').then(m => m.SafetyDetailsCapaComponent)
            },
            {
                path: 'safety-details-capa-review',
                loadComponent: () => import('./patient-safety/safety-check-survey/safety-details-capa-review/safety-details-capa-review.component').then(m => m.SafetyDetailsCapaReviewComponent)
            },
            {
                path: 'cp-list',
                loadComponent: () => import('./patient-safety/cplist/cplist.component').then(m => m.CplistComponent)
            },
            {
                path: 'cp-master',
                loadComponent: () => import('./patient-safety/cpmaster/cpmaster.component').then(m => m.CpmasterComponent)
            },
            {
                path: 'ipsg-questionnaire-master',
                loadComponent: () => import('./patient-safety/ipsgmaster/ipsgmaster.component').then(m => m.IpsgmasterComponent)
            },
            {
                path: 'sc-questionnaire-master',
                loadComponent: () => import('./patient-safety/scmaster/scmaster.component').then(m => m.ScmasterComponent)
            },
            {
                path: 'ipsg-dashboard',
                loadComponent: () => import('./patient-safety/ipsg/ipsg-dashboard/ipsg-dashboard.component').then(m => m.IpsgDashboardComponent)
            },
            {
                path: 'ipsg-listing',
                loadComponent: () => import('./patient-safety/ipsg/ipsg-listing/ipsg-listing.component').then(m => m.IpsgListingComponent)
            },
            {
                path: 'ipsg-details',
                loadComponent: () => import('./patient-safety/ipsg/ipsg-details/ipsg-details.component').then(m => m.IpsgDetailsComponent)
            },
            {
                path: 'ipsg-annualplan-report',
                loadComponent: () => import('./patient-safety/ipsg/ipsg-annualplan-report/ipsg-annualplan-report.component').then(m => m.IpsgAnnualplanReportComponent)
            },
            // License Master (route renamed from the misspelt lincense-master-*; old paths redirect)
            {
                path: 'license-master-add',
                loadComponent: () => import('./document-management/lincense-master/lincense-master-add/lincense-master-add.component').then(m => m.LincenseMasterAddComponent)
            },
            {
                path: 'license-master-dashboard',
                loadComponent: () => import('./document-management/lincense-master/lincense-master-dashboard/lincense-master-dashboard.component').then(m => m.LincenseMasterDashboardComponent)
            },
            { path: 'lincense-master-add', redirectTo: 'license-master-add', pathMatch: 'full' },
            { path: 'lincense-master-dashboard', redirectTo: 'license-master-dashboard', pathMatch: 'full' },
            // Document Library (approved documents, read only) and Quality Worklist
            {
                path: 'document-library',
                loadComponent: () => import('./document-management/document-library/document-library.component').then(m => m.DocumentLibraryComponent)
            },
            {
                path: 'document-worklist',
                loadComponent: () => import('./document-management/document-worklist/document-worklist.component').then(m => m.DocumentWorklistComponent)
            },
            // Provider Master
            {
                path: 'provider-master-add',
                loadComponent: () => import('./document-management/provider-master/provider-master-add/provider-master-add.component').then(m => m.ProviderMasterAddComponent)
            },
            {
                path: 'provider-master-dashboard',
                loadComponent: () => import('./document-management/provider-master/provider-master-dashboard/provider-master-dashboard.component').then(m => m.ProviderMasterDashboardComponent)
            },
            // License Tracker
            {
                path: 'license-tracker-dashboard',
                loadComponent: () => import('./document-management/license-tracker/license-tracker-dashboard/license-tracker-dashboard.component').then(m => m.LicenseTrackerDashboardComponent)
            },
            {
                path: 'license-tracker-listing',
                loadComponent: () => import('./document-management/license-tracker/license-tracker-listing/license-tracker-listing.component').then(m => m.LicenseTrackerListingComponent)
            },
            {
                path: 'license-tracker-details',
                loadComponent: () => import('./document-management/license-tracker/license-tracker-details/license-tracker-details.component').then(m => m.LicenseTrackerDetailsComponent)
            },
            {
                path: 'license-tracker-add',
                loadComponent: () => import('./document-management/license-tracker/license-tracker-add/license-tracker-add.component').then(m => m.LicenseTrackerAddComponent)
            },
            // MOU Tracker
            {
                path: 'mou-tracker-dashboard',
                loadComponent: () => import('./document-management/mou-tracker/mou-tracker-dashboard/mou-tracker-dashboard.component').then(m => m.MouTrackerDashboardComponent)
            },
            {
                path: 'mou-tracker-listing',
                loadComponent: () => import('./document-management/mou-tracker/mou-tracker-listing/mou-tracker-listing.component').then(m => m.MouTrackerListingComponent)
            },
            {
                path: 'mou-tracker-details',
                loadComponent: () => import('./document-management/mou-tracker/mou-tracker-details/mou-tracker-details.component').then(m => m.MouTrackerDetailsComponent)
            },
            {
                path: 'mou-tracker-add',
                loadComponent: () => import('./document-management/mou-tracker/mou-tracker-add/mou-tracker-add.component').then(m => m.MouTrackerAddComponent)
            },
            // Compliance Tracker
            {
                path: 'compliance-dashboard',
                loadComponent: () => import('./document-management/compliance/compliance-dashboard/compliance-dashboard.component').then(m => m.ComplianceDashboardComponent)
            },
            {
                path: 'compliance-listing',
                loadComponent: () => import('./document-management/compliance/compliance-listing/compliance-listing.component').then(m => m.ComplianceListingComponent)
            },
            {
                path: 'compliance-details',
                loadComponent: () => import('./document-management/compliance/compliance-details/compliance-details.component').then(m => m.ComplianceDetailsComponent)
            },
            {
                path: 'compliance-add',
                loadComponent: () => import('./document-management/compliance/compliance-add/compliance-add.component').then(m => m.ComplianceAddComponent)
            },
            // Version Control
            {
                path: 'version-control-dashboard',
                loadComponent: () => import('./document-management/version-control/version-control-dashboard/version-control-dashboard.component').then(m => m.VersionControlDashboardComponent)
            },
            {
                path: 'version-control-listing',
                loadComponent: () => import('./document-management/version-control/version-control-listing/version-control-listing.component').then(m => m.VersionControlListingComponent)
            },
            {
                path: 'version-control-details',
                loadComponent: () => import('./document-management/version-control/version-control-details/version-control-details.component').then(m => m.VersionControlDetailsComponent)
            },
            {
                path: 'version-control-add',
                loadComponent: () => import('./document-management/version-control/version-control-add/version-control-add.component').then(m => m.VersionControlAddComponent)
            },
            {
                path: 'version-control-uploadinfo',
                loadComponent: () => import('./document-management/version-control/version-control-uploadinfo/version-control-uploadinfo.component').then(m => m.VersionControlUploadinfoComponent)
            },
            {
                path: 'care-continuity-add',
                loadComponent: () => import('./feedback-management/prom/care-continuity-add/care-continuity-add.component').then(m => m.CareContinuityAddComponent)
            },
            {
                path: 'care-continuity-listing',
                loadComponent: () => import('./feedback-management/prom/care-continuity-listing/care-continuity-listing.component').then(m => m.CareContinuityListingComponent)
            },
            {
                path: 'prom-reports',
                loadComponent: () => import('./feedback-management/prom/prom-reports/prom-reports.component').then(m => m.PromReportsComponent)
            },
            {
                path: 'employee-survey-add',
                loadComponent: () => import('./feedback-management/employee-survey-add/employee-survey-add.component').then(m => m.EmployeeSurveyAddComponent)
            },
            // Training
            {
                path: 'master-dashboard',
                loadComponent: () => import('./training-management/master-dashboard/master-dashboard.component').then(m => m.MasterDashboardComponent)
            },
            {
                path: 'faculty-dashboard',
                loadComponent: () => import('./training-management/faculty-dashboard/faculty-dashboard.component').then(m => m.FacultyDashboardComponent)
            },
            {
                path: 'training-add',
                loadComponent: () => import('./training-management/training-add/training-add.component').then(m => m.TrainingAddComponent)
            },
            {
                path: 'faculty-add',
                loadComponent: () => import('./training-management/faculty-add/faculty-add.component').then(m => m.FacultyAddComponent)
            },
            // Assessment
            {
                path: 'assessment-dashboard',
                loadComponent: () => import('./training-management/assessment-management/assessment-dashboard/assessment-dashboard.component').then(m => m.AssessmentDashboardComponent)
            },
            {
                path: 'add-assessment',
                loadComponent: () => import('./training-management/assessment-management/add-assessment/add-assessment.component').then(m => m.AddAssessmentComponent)
            },
            {
                path: 'assessment-details',
                loadComponent: () => import('./training-management/assessment-management/assessment-details/assessment-details.component').then(m => m.AssessmentDetailsComponent)
            },
            // Schedule Training
            {
                path: 'schedule-dashboard',
                loadComponent: () => import('./training-management/schedule-training/schedule-dashboard/schedule-dashboard.component').then(m => m.ScheduleDashboardComponent)
            },
            {
                path: 'schedule-add',
                loadComponent: () => import('./training-management/schedule-training/schedule-add/schedule-add.component').then(m => m.ScheduleAddComponent)
            },
            {
                path: 'schedule-details',
                loadComponent: () => import('./training-management/schedule-training/schedule-details/schedule-details.component').then(m => m.ScheduleDetailsComponent)
            },
            {
                path: 'attendance-dashboard',
                loadComponent: () => import('./training-management/attendance/attendance-dashboard/attendance-dashboard.component').then(m => m.AttendanceDashboardComponent)
            },
            {
                path: 'attendance-listing',
                loadComponent: () => import('./training-management/attendance/attendance-listing/attendance-listing.component').then(m => m.AttendanceListingComponent)
            },
            {
                path: 'attendance-details',
                loadComponent: () => import('./training-management/attendance/attendance-details/attendance-details.component').then(m => m.AttendanceDetailsComponent)
            },
            {
                path: 'reports-dashboard',
                loadComponent: () => import('./training-management/training-reports/reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
            },
            {
                path: 'reports-details',
                loadComponent: () => import('./training-management/training-reports/reports-details/reports-details.component').then(m => m.ReportsDetailsComponent)
            },
            {
                path: 'training-report-employee-details',
                loadComponent: () => import('./training-management/training-reports/training-report-employee-details/training-report-employee-details.component').then(m => m.TrainingReportEmployeeDetailsComponent)
            },
            {
                path: 'feedback-dashboard',
                loadComponent: () => import('./training-management/training-feedback/feedback-dashboard/feedback-dashboard.component').then(m => m.FeedbackDashboardComponent)
            },
            {
                path: 'feedback-details',
                loadComponent: () => import('./training-management/training-feedback/feedback-details/feedback-details.component').then(m => m.FeedbackDetailsComponent)
            },
            {
                path: 'mytraining-dashboard',
                loadComponent: () => import('./training-management/my-training/mytraining-dashboard/mytraining-dashboard.component').then(m => m.MytrainingDashboardComponent)
            },
            {
                path: 'markattendance',
                loadComponent: () => import('./training-management/markattendance/markattendance.component').then(m => m.MarkattendanceComponent)
            },
            {
                path: 'feedbackposting',
                loadComponent: () => import('./training-management/feedbackposting/feedbackposting.component').then(m => m.FeedbackpostingComponent)
            },
            {
                path: 'assessmentupdate',
                loadComponent: () => import('./training-management/assessmentupdate/assessmentupdate.component').then(m => m.AssessmentupdateComponent)
            },
            {
                path: 'certificatedownload',
                loadComponent: () => import('./training-management/certificatedownload/certificatedownload.component').then(m => m.CertificatedownloadComponent)
            },
            // Vaccination
            {
                path: 'vaccine-master-dashboard',
                loadComponent: () => import('./vaccination-management/vaccine-master/vaccine-master-dashboard/vaccine-master-dashboard.component').then(m => m.VaccineMasterDashboardComponent)
            },
            {
                path: 'vaccine-add',
                loadComponent: () => import('./vaccination-management/vaccine-master/vaccine-add/vaccine-add.component').then(m => m.VaccineAddComponent)
            },
            {
                path: 'vaccine-details',
                loadComponent: () => import('./vaccination-management/vaccine-master-details/vaccine-details/vaccine-details.component').then(m => m.VaccineDetailsComponent)
            },
            {
                path: 'vaccine-schedule-dashboard',
                loadComponent: () => import('./vaccination-management/vaccine-schedule/vaccine-schedule-dashboard/vaccine-schedule-dashboard.component').then(m => m.VaccineScheduleDashboardComponent)
            },
            {
                path: 'vaccine-schedule-add',
                loadComponent: () => import('./vaccination-management/vaccine-schedule/vaccine-schedule-add/vaccine-schedule-add.component').then(m => m.VaccineScheduleAddComponent)
            },
            {
                path: 'vaccine-view',
                loadComponent: () => import('./vaccination-management/vaccine-master-details/vaccine-view/vaccine-view.component').then(m => m.VaccineViewComponent)
            },
            {
                path: 'update-vaccine',
                loadComponent: () => import('./vaccination-management/updatevaccine/updatevaccine.component').then(m => m.UpdatevaccineComponent)
            },
            {
                path: 'my-vaccines',
                loadComponent: () => import('./vaccination-management/my-vaccines/my-vaccines.component').then(m => m.MyVaccinesComponent)
            },
            {
                path: 'vaccination-aefi',
                loadComponent: () => import('./vaccination-management/aefi/aefi-register/aefi-register.component').then(m => m.AefiRegisterComponent)
            },
            {
                path: 'vaccination-history',
                loadComponent: () => import('./vaccination-management/history/history-approvals/history-approvals.component').then(m => m.HistoryApprovalsComponent)
            },
            // Advanced Module
            {
                path: 'staff-competency-dashboard',
                loadComponent: () => import('./advanced-modules/staff-competency/staff-competency-dashboard/staff-competency-dashboard.component').then(m => m.StaffCompetencyDashboardComponent)
            },
            {
                path: 'staff-competency-add',
                loadComponent: () => import('./advanced-modules/staff-competency/staff-competency-add/staff-competency-add.component').then(m => m.StaffCompetencyAddComponent)
            },
            {
                path: 'staff-competency-listing',
                loadComponent: () => import('./advanced-modules/staff-competency/staff-competency-listing/staff-competency-listing.component').then(m => m.StaffCompetencyListingComponent)
            },
            {
                path: 'staff-competency-manage-reviewer',
                loadComponent: () => import('./advanced-modules/staff-competency/staff-competency-manage-reviewer/staff-competency-manage-reviewer.component').then(m => m.StaffCompetencyManageReviewerComponent)
            },
            {
                path: 'oppe-reports',
                loadComponent: () => import('./advanced-modules/oppe/oppe-reports/oppe-reports.component').then(m => m.OppeReportsComponent)
            },
            {
                path: 'oppe-reports-details',
                loadComponent: () => import('./advanced-modules/oppe/oppe-reports-details/oppe-reports-details.component').then(m => m.OppeReportsDetailsComponent)
            },
            // Antibiotic Stewardship Program
            {
                path: 'antibiotic-stewardship-dashboard',
                loadComponent: () => import('./advanced-modules/antibiotic-stewardship-program/antibiotic-stewardship-dashboard/antibiotic-stewardship-dashboard.component').then(m => m.AntibioticStewardshipDashboardComponent)
            },
            {
                path: 'antibiotic-stewardship-review',
                loadComponent: () => import('./advanced-modules/antibiotic-stewardship-program/antibiotic-stewardship-review/antibiotic-stewardship-review.component').then(m => m.AntibioticStewardshipReviewComponent)
            },
            {
                path: 'antibiotic-stewardship-review-under-review',
                loadComponent: () => import('./advanced-modules/antibiotic-stewardship-program/antibiotic-stewardship-review-under-review/antibiotic-stewardship-review-under-review.component').then(m => m.AntibioticStewardshipReviewUnderReviewComponent)
            },
            {
                path: 'antibiotic-stewardship-review-closed',
                loadComponent: () => import('./advanced-modules/antibiotic-stewardship-program/antibiotic-stewardship-review-closed/antibiotic-stewardship-review-closed.component').then(m => m.AntibioticStewardshipReviewClosedComponent)
            },
            {
                path: 'antibiotic-integrity-overview',
                loadComponent: () => import('./advanced-modules/antibiotic-stewardship-program/antibiotic-integrity-overview/antibiotic-integrity-overview.component').then(m => m.AntibioticIntegrityOverviewComponent)
            },
            // KPI Management
            {
                path: 'category-master-add',
                loadComponent: () => import('./kpi-management/category-master/category-master-add/category-master-add.component').then(m => m.CategoryMasterAddComponent)
            },
            {
                path: 'category-master-dashboard',
                loadComponent: () => import('./kpi-management/category-master/category-master-dashboard/category-master-dashboard.component').then(m => m.CategoryMasterDashboardComponent)
            },
            {
                path: 'kpi-master-add',
                loadComponent: () => import('./kpi-management/kpi-master/kpi-master-add/kpi-master-add.component').then(m => m.KpiMasterAddComponent)
            },
            {
                path: 'kpi-data-capture',
                loadComponent: () => import('./kpi-management/dc/data-capture/data-capture.component').then(m => m.DataCaptureComponent)
            },
            {
                path: 'kpi-master-dashboard',
                loadComponent: () => import('./kpi-management/kpi-master/kpi-master-dashboard/kpi-master-dashboard.component').then(m => m.KpiMasterDashboardComponent)
            },

            {
                path: 'kpi-dashboard',
                loadComponent: () => import('./kpi-management/manage-kpi-setup/kpi-dashboard/kpi-dashboard.component').then(m => m.KpiDashboardComponent)
            },
            {
                path: 'kpi-setup-add',
                loadComponent: () => import('./kpi-management/manage-kpi-setup/kpi-setup-add/kpi-setup-add.component').then(m => m.KpiSetupAddComponent)
            },
            {
                path: 'capa-dashboard',
                loadComponent: () => import('./kpi-management/capa-summary/capa-dashboard/capa-dashboard.component').then(m => m.CapaDashboardComponent)
            },
            {
                path: 'capa-add',
                loadComponent: () => import('./kpi-management/capa-summary/capa-add/capa-add.component').then(m => m.CapaAddComponent)
            },
            {
                path: 'capa-details',
                loadComponent: () => import('./kpi-management/capa-summary/capa-details/capa-details.component').then(m => m.CapaDetailsComponent)
            },
            {
                path: 'kpi-reports-dashboard',
                loadComponent: () => import('./kpi-management/kpi-reports/kpi-reports-dashboard/kpi-reports-dashboard.component').then(m => m.KpiReportsDashboardComponent)
            },
            {
                path: 'kpi-reports-details',
                loadComponent: () => import('./kpi-management/kpi-reports/kpi-reports-details/kpi-reports-details.component').then(m => m.KpiReportsDetailsComponent)
            },
            // Commitee Management
            {
                path: 'write-capa-common',
                loadComponent: () => import('./kpi-management/capa-summary/write-capa-common/write-capa-common.component').then(m => m.WriteCapaCommonComponent)
            },
            {
                path: 'write-capa-specific',
                loadComponent: () => import('./kpi-management/capa-summary/write-capa-specific/write-capa-specific.component').then(m => m.WriteCapaSpecificComponent)
            },
            {
                path: 'committee-dashboard',
                loadComponent: () => import('./committee-management/manage-committee/committee-dashboard/committee-dashboard.component').then(m => m.CommitteeDashboardComponent)
            },
            {
                path: 'committee-add',
                loadComponent: () => import('./committee-management/manage-committee/committee-add/committee-add.component').then(m => m.CommitteeAddComponent)
            },
            {
                path: 'committee-report-listing',
                loadComponent: () => import('./committee-management/manage-committee/committee-report-listing/committee-report-listing.component').then(m => m.CommitteeReportListingComponent)
            },
            {
                path: 'committee-report-details',
                loadComponent: () => import('./committee-management/manage-committee/committee-report-details/committee-report-details.component').then(m => m.CommitteeReportDetailsComponent)
            },
            {
                path: 'schedule-commitee-meetings-dashboard',
                loadComponent: () => import('./committee-management/schedule-commitee-meetings/schedule-commitee-meetings-dashboard/schedule-commitee-meetings-dashboard.component').then(m => m.ScheduleCommiteeMeetingsDashboardComponent)
            },
            {
                path: 'schedule-commitee-meetings-add',
                loadComponent: () => import('./committee-management/schedule-commitee-meetings/schedule-commitee-meetings-add/schedule-commitee-meetings-add.component').then(m => m.ScheduleCommiteeMeetingsAddComponent)
            },
            {
                path: 'schedule-commitee-meetings-details',
                loadComponent: () => import('./committee-management/schedule-commitee-meetings/schedule-commitee-meetings-details/schedule-commitee-meetings-details.component').then(m => m.ScheduleCommiteeMeetingsDetailsComponent)
            },
            {
                path: 'manage-meetings-dashboard',
                loadComponent: () => import('./committee-management/manage-meetings/manage-meetings-dashboard/manage-meetings-dashboard.component').then(m => m.ManageMeetingsDashboardComponent)
            },
            {
                path: 'manage-meetings-add',
                loadComponent: () => import('./committee-management/manage-meetings/manage-meetings-add/manage-meetings-add.component').then(m => m.ManageMeetingsAddComponent)
            },
            {
                path: 'manage-meetings-details',
                loadComponent: () => import('./committee-management/manage-meetings/manage-meetings-details/manage-meetings-details.component').then(m => m.ManageMeetingsDetailsComponent)
            },
            {
                path: 'meeting-attendance',
                loadComponent: () => import('./committee-management/meeting-attendance/meeting-attendance.component').then(m => m.MeetingAttendanceComponent)
            },
            // Task Assignments
            {
                path: 'task-assignments-dashboard',
                loadComponent: () => import('./task-assignments/task-assignments-dashboard/task-assignments-dashboard.component').then(m => m.TaskAssignmentsDashboardComponent)
            },
            {
                path: 'task-assignments-add',
                loadComponent: () => import('./task-assignments/task-assignments-add/task-assignments-add.component').then(m => m.TaskAssignmentsAddComponent)
            },
            {
                path: 'task-assignments-details',
                loadComponent: () => import('./task-assignments/task-assignments-details/task-assignments-details.component').then(m => m.TaskAssignmentsDetailsComponent)
            },
            {
                path: 'prem-daily-feedbacks',
                loadComponent: () => import('./feedback-management/prem/prem-daily-feedbacks/prem-daily-feedbacks.component').then(m => m.PremDailyFeedbacksComponent)
            },
            {
                path: 'prem-discharge-feedbacks',
                loadComponent: () => import('./feedback-management/prem/prem-discharge-feedbacks/prem-discharge-feedbacks.component').then(m => m.PremDischargeFeedbacksComponent)
            },
            {
                path: 'prem-outpatient-feedbacks',
                loadComponent: () => import('./feedback-management/prem/prem-outpatient-feedbacks/prem-outpatient-feedbacks.component').then(m => m.PremOutpatientFeedbacksComponent)
            },
            {
                path: 'reports-nominee-view',
                loadComponent: () => import('./training-management/training-reports/reports-nominee-view/reports-nominee-view.component').then(m => m.ReportsNomineeViewComponent)
            },
            {
                path: 'prem-overall-feedback-report',
                loadComponent: () => import('./feedback-management/prem/prem-overall-feedback-report/prem-overall-feedback-report.component').then(m => m.PremOverallFeedbackReportComponent)
            },
            {
                path: 'notifications',
                loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent)
            },
            {
                path: 'help-support',
                loadComponent: () => import('./help-support/help-support.component').then(m => m.HelpSupportComponent)
            },
            // Audit Management
            {
                path: 'audit-master-details',
                loadComponent: () => import('./audit-management/audit-master/audit-master-details/audit-master-details.component').then(m => m.AuditMasterDetailsComponent)
            },
            {
                path: 'audit-type-create',
                loadComponent: () => import('./audit-management/audit-types/audit-type-create/audit-type-create.component').then(m => m.AuditTypeCreateComponent)
            },
            {
                path: 'audit-type-details',
                loadComponent: () => import('./audit-management/audit-types/audit-type-details/audit-type-details.component').then(m => m.AuditTypeDetailsComponent)
            },
            {
                path: 'write-capa-type',
                loadComponent: () => import('./audit-management/audit-types/write-capa-type/write-capa-type.component').then(m => m.WriteCapaTypeComponent)
            },
            {
                path: 'write-capa-review',
                loadComponent: () => import('./audit-management/audit-types/write-capa-review/write-capa-review.component').then(m => m.WriteCapaReviewComponent)
            },
            //Org & Loc
            {
                path: 'organization',
                loadComponent: () => import('./setup/organization/organization.component').then(m => m.OrganizationComponent)
            },
            {
                path: 'organizationgrid',
                loadComponent: () => import('./setup/organizationgrid/organizationgrid.component').then(m => m.OrganizationgridComponent)
            },
            {
                path: 'location',
                loadComponent: () => import('./setup/location/location.component').then(m => m.LocationComponent)
            },
            {
                path: 'locationgrid',
                loadComponent: () => import('./setup/locationgrid/locationgrid.component').then(m => m.LocationgridComponent)
            },

            //Security
            {
                path: 'modulelist',
                loadComponent: () => import('./security/mdsmgrid/mdsmgrid.component').then(m => m.MdsmgridComponent)
            },
            {
                path: 'module',
                loadComponent: () => import('./security/mdsm/mdsm.component').then(m => m.MdsmComponent)
            },
            {
                path: 'documentlist',
                loadComponent: () => import('./security/documentgrid/documentgrid.component').then(m => m.DocumentgridComponent)
            },
            {
                path: 'document',
                loadComponent: () => import('./security/document/document.component').then(m => m.DocumentComponent)
            },
            {
                path: 'mdm',
                loadComponent: () => import('./security/mdmapping/mdmapping.component').then(m => m.MdmappingComponent)
            },
            {
                path: 'rolelist',
                loadComponent: () => import('./security/rolegrid/rolegrid.component').then(m => m.RolegridComponent)
            },
            {
                path: 'role',
                loadComponent: () => import('./security/role/role.component').then(m => m.RoleComponent)
            },
            {
                path: 'lmm',
                loadComponent: () => import('./security/lmm/lmm.component').then(m => m.LmmComponent)
            },
            {
                path: 'nulist',
                loadComponent: () => import('./security/usergrid/usergrid.component').then(m => m.UsergridComponent)
            },
            {
                path: 'nu',
                loadComponent: () => import('./security/user/user.component').then(m => m.UserComponent)
            },
            {
                path: 'accrole',
                loadComponent: () => import('./security/accessbyrole/accessbyrole.component').then(m => m.AccessbyroleComponent)
            },
            {
                path: 'accuser',
                loadComponent: () => import('./security/accessbyuser/accessbyuser.component').then(m => m.AccessbyuserComponent)
            },
            {
                path: 'pps',
                loadComponent: () => import('./security/passwordpolicy/passwordpolicy.component').then(m => m.PasswordpolicyComponent)
            },
            {
                path: 'approvalworkflow',
                loadComponent: () => import('./security/approvalworkflow/approvalworkflow.component').then(m => m.ApprovalworkflowComponent)
            },
            {
                path: 'approvalworkflowgrid',
                loadComponent: () => import('./security/approvalworkflowgrid/approvalworkflowgrid.component').then(m => m.ApprovalworkflowgridComponent)
            },
            // Common Dashboard
            {
                path: 'management-dashboard',
                loadComponent: () => import('./common-dashboard/management-dashboard/management-dashboard.component').then(m => m.ManagementDashboardComponent)
            },
            {
                path: 'hr-dashboard',
                loadComponent: () => import('./common-dashboard/hr-dashboard/hr-dashboard.component').then(m => m.HrDashboardComponent)
            },
            {
                path: 'grievance-details-capa',
                loadComponent: () => import('./feedback-management/grievance-complaint-mangement/grievance-details-capa/grievance-details-capa.component').then(m => m.GrievanceDetailsCapaComponent)
            },
            {
                path: 'grievance-view',
                loadComponent: () => import('./feedback-management/grievance-complaint-mangement/grievance-view/grievance-view.component').then(m => m.GrievanceViewComponent)
            },
            {
                path: 'clinical-capa',
                loadComponent: () => import('./patient-safety/clinical-pathway/clinical-capa/clinical-capa.component').then(m => m.ClinicalCapaComponent)
            },
            {
                path: 'clinical-capa-review',
                loadComponent: () => import('./patient-safety/clinical-pathway/clinical-capa-review/clinical-capa-review.component').then(m => m.ClinicalCapaReviewComponent)
            },
            {
                path: 'ipsg-audit',
                loadComponent: () => import('./patient-safety/ipsg/ipsg-audit/ipsg-audit.component').then(m => m.IpsgAuditComponent)
            },
            {
                path: 'ipsg-capa',
                loadComponent: () => import('./patient-safety/ipsg/ipsg-capa/ipsg-capa.component').then(m => m.IpsgCapaComponent)
            },
            {
                path: 'ipsg-capa-review',
                loadComponent: () => import('./patient-safety/ipsg/ipsg-capa-review/ipsg-capa-review.component').then(m => m.IpsgCapaReviewComponent)
            },
            {
                path: 'capa-summary-listing',
                loadComponent: () => import('./capa-summary/capa-summary-listing/capa-summary-listing.component').then(m => m.CapaSummaryListingComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./myaccount/settings/settings.component').then(m => m.SettingsComponent)
            },

             {
                path: 'application-setting',
                loadComponent: () => import('./security/appsetting/appsetting.component').then(m => m.AppsettingComponent)
            },
            {
                path: 'theme-brand',
                loadComponent: () => import('./myaccount/theme-brand/theme-brand.component').then(m => m.ThemeBrandComponent)
            },
            {
                path: 'workplace-dashboard',
                loadComponent: () => import('./myworkplace/workplace-dashboard/workplace-dashboard.component').then(m => m.WorkplaceDashboardComponent)
            },

            // ADMIN
            {
                path: 'entity',
                loadComponent: () => import('./admin/entity/entities-list/entities-list.component').then(m => m.EntitiesListComponent)
             },

            {
                 path : 'reponsescales',
                 loadComponent : () => import('./template/responsescale/responsescale.component').then(m=>m.ResponsescaleComponent)
            },
            {
                 path : 'questionbank',
                loadComponent : () => import('./template/questionbank/questionbank.component').then(m=>m.QuestionbankComponent)

            },
            {
                 path : 'templatebuilder',
                 loadComponent : () => import('./template/templatebuilder/templatebuilder.component').then(m=>m.TemplatebuilderComponent)

            },
             {
                 path : 'schedules',
                 loadComponent : () => import('./template/schedule/schedule.component').then(m=>m.ScheduleComponent)

            },
             {
                 path : 'nopermissions',
                 loadComponent : () => import('./fallbacks/noprmsns/noprmsns.component').then(m=>m.NoprmsnsComponent)

            },
            { path: '', redirectTo: 'management-dashboard', pathMatch: 'full' },
            // Unknown URL after login → permissionGuard shows "Access Denied" (the page itself never loads).
            {
                path: '**',
                loadComponent: () => import('./fallbacks/noprmsns/noprmsns.component').then(m => m.NoprmsnsComponent)
            }
        ]
    },
    { path: '**', redirectTo: 'login' },
];
