// Client-safe metadata and types for the Domestic Education section.
// NO Node-only imports (e.g. pg) so this can be imported from client components
// without pulling the database driver into the browser bundle.

export type MetricUnit = "students" | "count" | "percent" | "eftsl";

export type MetricMeta = {
  key: string;
  label: string;
  short: string;
  unit: MetricUnit;
  // funnel stage, for ordering/grouping on the page
  stage: "school" | "transition" | "university";
  note: string;
};

export const METRICS: MetricMeta[] = [
  { key: "school_enrolments", label: "School enrolments (all grades)", short: "School enrolments",
    unit: "students", stage: "school",
    note: "ABS Schools — students by state of schooling." },
  { key: "year12_enrolments", label: "Year 12 enrolments", short: "Year 12 enrolments",
    unit: "students", stage: "school",
    note: "ABS Schools — Year 12 students by state of schooling." },
  { key: "apparent_retention_y12", label: "Apparent retention to Year 12", short: "Retention to Yr 12",
    unit: "percent", stage: "school",
    note: "ABS Schools — capped apparent retention (all affiliations, persons). Volatile for small populations." },
  { key: "ug_applications", label: "Undergraduate applications", short: "UG applications",
    unit: "count", stage: "transition",
    note: "Dept of Education — domestic UG applications (TAC + direct CSP). Demand indicator." },
  { key: "ug_offers", label: "Undergraduate offers", short: "UG offers",
    unit: "count", stage: "transition",
    note: "Dept of Education — domestic UG offers (continuous series; QLD TAC break excluded)." },
  { key: "ug_offer_rate", label: "Undergraduate offer rate", short: "UG offer rate",
    unit: "percent", stage: "transition",
    note: "Dept of Education — offers ÷ applications." },
  { key: "he_commencing_ug", label: "Commencing undergraduates", short: "Commencing UG",
    unit: "students", stage: "university",
    note: "Dept of Education HE — commencing UG by institution location (perturbed; not student origin)." },
  { key: "he_completions_ug", label: "Undergraduate completions", short: "UG completions",
    unit: "students", stage: "university",
    note: "Dept of Education HE — UG award completions by institution location (perturbed)." },
  { key: "he_eftsl_commencing_ug", label: "Commencing UG study load (EFTSL)", short: "Commencing EFTSL",
    unit: "eftsl", stage: "university",
    note: "Dept of Education HE — commencing UG equivalent full-time student load (perturbed)." },
];

// The eight geographic states/territories, in a sensible display order.
export const STATES: { code: string; name: string }[] = [
  { code: "NSW", name: "New South Wales" },
  { code: "VIC", name: "Victoria" },
  { code: "QLD", name: "Queensland" },
  { code: "WA", name: "Western Australia" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NT", name: "Northern Territory" },
];
export const NATIONAL_CODE = "AUS";

export type StatePoint = {
  year: number;
  stateCode: string;
  stateName: string;
  metric: string;
  unit: MetricUnit;
  value: number;
};

// National undergraduate demand by broad Field of Education (no state dimension
// — the source publishes applications by field only nationally).
export type FieldDemandRow = {
  field: string;
  applications: number;
  offers: number;
  offerRate: number; // 0..1
};
export type FieldDemand = {
  year: number;
  rows: FieldDemandRow[]; // sorted by applications desc
};
