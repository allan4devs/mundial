import companyData from "./companies.json";
import nearshoreData from "./nearshore.json";
import expandedCompanies from "./expanded-companies.json";
import employerRoles from "./employer-roles.json";
import { buildCompanyCatalog, type CompanyCard } from "./company-catalog";

export type { CompanyCard } from "./company-catalog";
export const companies = buildCompanyCatalog(companyData, nearshoreData, expandedCompanies as CompanyCard[]);
for (const evidence of employerRoles) {
  const company = companies.find(item => item.key === evidence.key);
  if (!company) continue;
  const jobs = new Map(company.jobs.map(job => [job.url || job.id, job]));
  for (const job of evidence.jobs) jobs.set(job.url || job.id, job);
  company.jobs = [...jobs.values()];
  company.records = company.jobs.length;
  company.roleEvidence = { source: evidence.source, checkedOn: evidence.checkedOn };
}
