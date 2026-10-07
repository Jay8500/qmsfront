// Route access data used by the permission guard (auth.guard.ts → permissionGuard).
// A typed / refreshed URL is allowed when it is:
//   - always allowed (below), or
//   - a menu URL the user has: a module's module_route or a document's primary_url, or
//   - a sub-page (add / edit / details) of a menu URL the user has (SUB_PAGES).
// In-app navigation (menu, buttons, redirect after login) is always allowed.
// primary_url / module_route values must equal the Angular route paths in app.routes.ts.

export const NO_PERMISSION_ROUTE = 'nopermissions';

// Pages every logged-in user may open.
export const ALWAYS_ALLOWED: string[] = [NO_PERMISSION_ROUTE, 'notifications'];

// Menu URL (primary_url / module_route) → its sub-pages.
// Built from the component folders and the pages that navigate to them (reviewed 2026-10-06).
// A new sub-page route must be added here, otherwise a refresh / typed URL on it is denied.
export const SUB_PAGES: Record<string, string[]> = {
  'my-vaccines': ['vaccine-view'],
  'antibiotic-stewardship-dashboard': ['antibiotic-integrity-overview', 'antibiotic-stewardship-review', 'antibiotic-stewardship-review-closed', 'antibiotic-stewardship-review-under-review'],
  'approvalworkflowgrid': ['approvalworkflow'],
  'assessment-dashboard': ['add-assessment', 'assessment-details'],
  'attendance-dashboard': ['attendance-details', 'attendance-listing', 'markattendance'],
  'audit-master-dashboard': ['audit-master-details', 'create-audit'],
  'audit-reports-listing': ['audits-dashboard', 'audits-details', 'audits-listing'],
  'audit-type-dashboard': ['audit-type-create', 'audit-type-details', 'write-capa-review', 'write-capa-type'],
  'capa-dashboard': ['capa-add', 'capa-details', 'write-capa-common', 'write-capa-specific'],
  'category-master-dashboard': ['category-master-add'],
  'clinical-dashboard': ['clinical-capa', 'clinical-capa-review', 'clinical-details', 'clinical-listing', 'new-audit'],
  'committee-dashboard': ['committee-add', 'committee-report-details'],
  'cp-list': ['cp-master'],
  'employee-dashboard': ['employee-details', 'employee-listing', 'employee-survey-add', 'employee-survey-capa'],
  'feedback-dashboard': ['feedback-details'],
  'grievance-dashboard': ['grievance-add', 'grievance-details', 'grievance-details-capa', 'grievance-listing', 'grievance-view'],
  'incident-dashboard': ['incident-add', 'incident-details', 'incident-listing', 'investigation', 'investigation-dashboard', 'quality-listing', 'risk-details'],
  'investigation-dashboard': ['investigation', 'incident-details'],
  'incident-rules': [],
  'ipsg-dashboard': ['ipsg-annualplan-report', 'ipsg-audit', 'ipsg-capa', 'ipsg-capa-review', 'ipsg-details', 'ipsg-listing'],
  'kpi-master-dashboard': ['kpi-dashboard', 'kpi-master-add', 'kpi-setup-add'],
  'kpi-reports-dashboard': ['kpi-reports-details'],
  'license-tracker-dashboard': ['license-tracker-add', 'license-tracker-details', 'license-tracker-listing'],
  // License Master: new route + the old misspelt one (before the menu seed is run on a database)
  'license-master-dashboard': ['license-master-add', 'lincense-master-add', 'lincense-master-dashboard'],
  'lincense-master-dashboard': ['compliance-add', 'compliance-dashboard', 'compliance-details', 'compliance-listing', 'lincense-master-add', 'license-master-add', 'license-master-dashboard'],
  // Quality Worklist opens the details pages of License / MoU / Version Control
  'document-worklist': ['license-tracker-details', 'mou-tracker-details', 'version-control-details'],
  'manage-meetings-dashboard': ['manage-meetings-add', 'manage-meetings-details', 'meeting-attendance'],
  'management-dashboard': ['hr-dashboard'],
  'master-dashboard': ['faculty-add', 'faculty-dashboard', 'training-add'],
  'modulelist': ['document', 'documentlist', 'lmm', 'module'],
  'mou-tracker-dashboard': ['mou-tracker-add', 'mou-tracker-details', 'mou-tracker-listing'],
  'nulist': ['nu'],
  'oppe-reports': ['oppe-reports-details'],
  'prem-master-add': ['prem-daily-feedback-details', 'prem-daily-feedback-listing', 'prem-discharge-feedback-details', 'prem-discharge-feedback-listing', 'prem-discharge-feedbacks', 'prem-feedback', 'prem-outpatient-feedbacks', 'prem-outpatint-feedback-details', 'prem-outpatint-feedback-listing', 'prem-overall-feedback-report'],
  'prom-dashboard': ['care-continuity-add', 'care-continuity-listing', 'prom-add', 'prom-details', 'prom-listing', 'prom-overall-report', 'prom-reports'],
  'provider-master-dashboard': ['provider-master-add'],
  'reports-dashboard': ['reports-details', 'reports-nominee-view', 'training-report-employee-details'],
  'risk-dashboard': ['risk-add', 'risk-details', 'risk-listing', 'incident-details'],
  'risk-evaluation': ['risk-details'],
  'risk-review': ['risk-details'],
  'rolelist': ['role'],
  'safety-dashboard': ['add-survey', 'safety-details', 'safety-details-capa', 'safety-details-capa-review', 'sc-questionnaire-master'],
  'schedule-audit-dashboard': ['schedule-audit-add'],
  'schedule-commitee-meetings-dashboard': ['schedule-commitee-meetings-add', 'schedule-commitee-meetings-details'],
  'schedule-dashboard': ['schedule-add', 'schedule-details'],
  'settings': ['location', 'locationgrid', 'organization', 'organizationgrid', 'theme-brand'],
  'staff-competency-dashboard': ['staff-competency-add', 'staff-competency-listing', 'staff-competency-manage-reviewer'],
  'task-assignments-dashboard': ['task-assignments-add', 'task-assignments-details'],
  'vaccine-details': ['vaccine-view'],
  'vaccine-master-dashboard': ['vaccine-add'],
  'vaccine-schedule-dashboard': ['vaccine-schedule-add'],
  'version-control-dashboard': ['version-control-add', 'version-control-details', 'version-control-listing', 'version-control-uploadinfo'],
  'workplace-dashboard': ['mytraining-dashboard'],
};

// Sub-page → the menu URLs it belongs to (a sub-page can open from more than one screen)
export const SUB_PAGE_PARENTS: Record<string, string[]> = Object.entries(SUB_PAGES)
  .reduce((acc, [parent, children]) => {
    children.forEach((child) => (acc[child] = [...(acc[child] || []), parent]));
    return acc;
  }, {} as Record<string, string[]>);

// First path segment of a URL, e.g. '/vaccine-add?x=1' → 'vaccine-add'
export function firstSegment(url: string): string {
  return (url || '').split(/[?#]/)[0].replace(/^\/+/, '').split('/')[0];
}
