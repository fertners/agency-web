import {
  agentJobListResponseSchema,
  createRestaurantWebsiteResponseSchema,
  createDesignReviewResponseSchema,
  designReviewListResponseSchema,
  createQualityReviewResponseSchema,
  qualityReportListResponseSchema,
  healthResponseSchema,
  websiteListResponseSchema,
  websiteVersionListResponseSchema,
  websiteVersionResponseSchema,
  type AgentJobListResponse,
  type CreateRestaurantWebsiteRequest,
  type CreateDesignReviewResponse,
  type DesignReviewListResponse,
  type CreateQualityReviewResponse,
  type QualityReportListResponse,
  type CreateRestaurantWebsiteResponse,
  type HealthResponse,
  type WebsiteListResponse,
  type WebsiteVersionListResponse,
  type WebsiteVersionResponse,
  prospectListResponseSchema,
  createProspectSearchResponseSchema,
  type ProspectListResponse,
  type ProspectSearchRequest,
  type CreateProspectSearchResponse,
  communicationDraftSchema,
  conversationDetailSchema,
  conversationListResponseSchema,
  proposalListResponseSchema,
  proposalSchema,
  publicProposalDecisionResponseSchema,
  publicProposalSchema,
  prospectDetailResponseSchema,
  type CommunicationDraft,
  type ConversationListResponse,
  type ConversationDetail,
  type CreateDraftRequest,
  type CreateProposalRequest,
  type CreateProspectNoteRequest,
  type DraftDecisionRequest,
  type Proposal,
  type ProposalDecisionRequest,
  type ProposalListResponse,
  type PublicProposal,
  type PublicProposalDecisionResponse,
  type ProspectDetailResponse,
  type UpdateProspectStatusRequest,
  attachProjectWebsiteRequestSchema,
  clientListResponseSchema,
  clientDetailSchema,
  convertProspectResponseSchema,
  createDeploymentResponseSchema,
  deploymentListResponseSchema,
  deploymentSchema,
  projectListResponseSchema,
  projectSchema,
  type AttachProjectWebsiteRequest,
  type ClientListResponse,
  type ClientDetail,
  type ConvertProspectRequest,
  type CreateDeploymentRequest,
  type CreateDeploymentResponse,
  type Deployment,
  type DeploymentListResponse,
  type Project,
  type ProjectListResponse,
  type RollbackDeploymentRequest,
  analyticsSchema,
  companyDetailSchema,
  companyListResponseSchema,
  dashboardOverviewSchema,
  operationsJobDetailSchema,
  operationsJobListSchema,
  paginatedProspectListSchema,
  settingsResponseSchema,
  templateListSchema,
  templateDetailSchema,
  type Analytics,
  type CompanyDetail,
  type CompanyListResponse,
  type DashboardOverview,
  type OperationsJobDetail,
  type OperationsJobList,
  type PaginatedProspectList,
  type SettingsResponse,
  type TemplateList,
  type TemplateDetail,
  type UpdateSettingsRequest,
} from '@ai-web-agency/shared';

function getApiUrl(): string {
  return process.env.API_URL ?? 'http://127.0.0.1:3001';
}

export async function getProspects(): Promise<ProspectListResponse> {
  return prospectListResponseSchema.parse(await getJson('/prospects'));
}
export async function searchProspects(
  request: ProspectSearchRequest,
): Promise<CreateProspectSearchResponse> {
  const response = await fetch(`${getApiUrl()}/prospects/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    cache: 'no-store',
  });
  const body: unknown = await response.json();
  if (!response.ok) throw new Error('La recherche n’a pas pu démarrer.');
  return createProspectSearchResponseSchema.parse(body);
}

async function mutate(
  path: string,
  method: 'POST' | 'PATCH',
  body: unknown,
): Promise<unknown> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const result: unknown = await response.json();
  if (!response.ok)
    throw new Error(`API mutation failed with ${response.status}`);
  return result;
}

export async function getProspect(id: string): Promise<ProspectDetailResponse> {
  return prospectDetailResponseSchema.parse(
    await getJson(`/prospects/${encodeURIComponent(id)}`),
  );
}
export async function updateProspectStatus(
  id: string,
  request: UpdateProspectStatusRequest,
): Promise<ProspectDetailResponse> {
  return prospectDetailResponseSchema.parse(
    await mutate(
      `/prospects/${encodeURIComponent(id)}/status`,
      'PATCH',
      request,
    ),
  );
}
export async function addProspectNote(
  id: string,
  request: CreateProspectNoteRequest,
): Promise<ProspectDetailResponse> {
  return prospectDetailResponseSchema.parse(
    await mutate(`/prospects/${encodeURIComponent(id)}/notes`, 'POST', request),
  );
}
export async function createProposal(
  id: string,
  request: CreateProposalRequest,
): Promise<Proposal> {
  return proposalSchema.parse(
    await mutate(
      `/prospects/${encodeURIComponent(id)}/proposals`,
      'POST',
      request,
    ),
  );
}
export async function getProposals(): Promise<ProposalListResponse> {
  return proposalListResponseSchema.parse(await getJson('/proposals'));
}
export async function decideProposal(
  id: string,
  request: ProposalDecisionRequest,
): Promise<Proposal> {
  return proposalSchema.parse(
    await mutate(
      `/proposals/${encodeURIComponent(id)}/decision`,
      'POST',
      request,
    ),
  );
}
export async function getPublicProposal(
  token: string,
): Promise<PublicProposal> {
  return publicProposalSchema.parse(
    await getJson(`/public/proposals/${encodeURIComponent(token)}`),
  );
}
export async function respondToPublicProposal(
  token: string,
  decision: 'accept' | 'decline',
): Promise<PublicProposalDecisionResponse> {
  return publicProposalDecisionResponseSchema.parse(
    await mutate(
      `/public/proposals/${encodeURIComponent(token)}/respond`,
      'POST',
      { decision },
    ),
  );
}
export async function createConversationDraft(
  id: string,
  request: CreateDraftRequest,
): Promise<CommunicationDraft> {
  return communicationDraftSchema.parse(
    await mutate(
      `/prospects/${encodeURIComponent(id)}/conversations/drafts`,
      'POST',
      request,
    ),
  );
}
export async function getConversations(): Promise<ConversationListResponse> {
  return conversationListResponseSchema.parse(await getJson('/conversations'));
}
export async function getConversation(id: string): Promise<ConversationDetail> {
  return conversationDetailSchema.parse(
    await getJson(`/conversations/${encodeURIComponent(id)}`),
  );
}
export async function decideDraft(
  id: string,
  request: DraftDecisionRequest,
): Promise<CommunicationDraft> {
  return communicationDraftSchema.parse(
    await mutate(
      `/conversations/drafts/${encodeURIComponent(id)}/decision`,
      'POST',
      request,
    ),
  );
}

export async function convertProspect(
  id: string,
  request: ConvertProspectRequest,
) {
  return convertProspectResponseSchema.parse(
    await mutate(
      `/prospects/${encodeURIComponent(id)}/convert`,
      'POST',
      request,
    ),
  );
}
export async function getClients(): Promise<ClientListResponse> {
  return clientListResponseSchema.parse(await getJson('/clients'));
}
export async function getClient(id: string): Promise<ClientDetail> {
  return clientDetailSchema.parse(
    await getJson(`/clients/${encodeURIComponent(id)}`),
  );
}
export async function getProjects(): Promise<ProjectListResponse> {
  return projectListResponseSchema.parse(await getJson('/projects'));
}
export async function attachProjectWebsite(
  id: string,
  request: AttachProjectWebsiteRequest,
): Promise<Project> {
  return projectSchema.parse(
    await mutate(
      `/projects/${encodeURIComponent(id)}/website`,
      'PATCH',
      attachProjectWebsiteRequestSchema.parse(request),
    ),
  );
}
export async function createDeployment(
  id: string,
  request: CreateDeploymentRequest,
): Promise<CreateDeploymentResponse> {
  return createDeploymentResponseSchema.parse(
    await mutate(
      `/projects/${encodeURIComponent(id)}/deployments`,
      'POST',
      request,
    ),
  );
}
export async function getDeployments(): Promise<DeploymentListResponse> {
  return deploymentListResponseSchema.parse(await getJson('/deployments'));
}
export async function rollbackDeployment(
  id: string,
  request: RollbackDeploymentRequest,
): Promise<Deployment> {
  return deploymentSchema.parse(
    await mutate(
      `/projects/${encodeURIComponent(id)}/rollback`,
      'POST',
      request,
    ),
  );
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${getApiUrl()}${path}`, { cache: 'no-store' });
  if (!response.ok)
    throw new Error(`API request failed with ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function getDashboardOverview(
  period = '30d',
): Promise<DashboardOverview> {
  return dashboardOverviewSchema.parse(
    await getJson(`/dashboard/overview?period=${encodeURIComponent(period)}`),
  );
}

export async function getAnalytics(period = '30d'): Promise<Analytics> {
  return analyticsSchema.parse(
    await getJson(`/analytics?period=${encodeURIComponent(period)}`),
  );
}

export async function getCompanies(
  query = 'page=1&limit=20',
): Promise<CompanyListResponse> {
  return companyListResponseSchema.parse(await getJson(`/companies?${query}`));
}

export async function getCompany(id: string): Promise<CompanyDetail> {
  return companyDetailSchema.parse(
    await getJson(`/companies/${encodeURIComponent(id)}`),
  );
}

export async function getProspectDirectory(
  query = 'page=1&limit=20',
): Promise<PaginatedProspectList> {
  return paginatedProspectListSchema.parse(
    await getJson(`/prospect-directory?${query}`),
  );
}

export async function getOperationsJobs(
  query = 'page=1&limit=20',
): Promise<OperationsJobList> {
  return operationsJobListSchema.parse(await getJson(`/agent-jobs?${query}`));
}

export async function getOperationsJob(
  id: string,
): Promise<OperationsJobDetail> {
  return operationsJobDetailSchema.parse(
    await getJson(`/agent-jobs/${encodeURIComponent(id)}`),
  );
}

export async function getTemplates(): Promise<TemplateList> {
  return templateListSchema.parse(await getJson('/templates'));
}
export async function getTemplate(id: string): Promise<TemplateDetail> {
  return templateDetailSchema.parse(
    await getJson(`/templates/${encodeURIComponent(id)}`),
  );
}

export async function getSettings(): Promise<SettingsResponse> {
  return settingsResponseSchema.parse(await getJson('/settings'));
}

export async function updateSettings(
  request: UpdateSettingsRequest,
): Promise<SettingsResponse> {
  return settingsResponseSchema.parse(
    await mutate('/settings', 'PATCH', request),
  );
}

export async function getHealth(): Promise<HealthResponse> {
  return healthResponseSchema.parse(await getJson('/health'));
}

export async function getJobs(): Promise<AgentJobListResponse> {
  return agentJobListResponseSchema.parse(await getJson('/jobs'));
}

export async function createDiagnosticJob(): Promise<void> {
  const response = await fetch(`${getApiUrl()}/jobs/diagnostic`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Unable to create diagnostic job');
}

export async function getWebsites(): Promise<WebsiteListResponse> {
  return websiteListResponseSchema.parse(await getJson('/websites'));
}

export async function createRestaurantWebsite(
  request: CreateRestaurantWebsiteRequest,
): Promise<CreateRestaurantWebsiteResponse> {
  const response = await fetch(`${getApiUrl()}/websites/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    cache: 'no-store',
  });
  const body: unknown = await response.json();
  if (!response.ok)
    throw new Error('La création du site a échoué. Vérifiez les champs.');
  return createRestaurantWebsiteResponseSchema.parse(body);
}

export async function generateWebsiteFromProspect(
  prospectId: string,
): Promise<CreateRestaurantWebsiteResponse> {
  return createRestaurantWebsiteResponseSchema.parse(
    await mutate(
      `/websites/from-prospect/${encodeURIComponent(prospectId)}`,
      'POST',
      {},
    ),
  );
}

export async function getWebsiteVersions(
  websiteId: string,
): Promise<WebsiteVersionListResponse> {
  return websiteVersionListResponseSchema.parse(
    await getJson(`/websites/${encodeURIComponent(websiteId)}/versions`),
  );
}

export async function reviewWebsiteVersion(
  websiteId: string,
  versionId: string,
  decision: 'approve' | 'reject',
): Promise<WebsiteVersionResponse> {
  const response = await fetch(
    `${getApiUrl()}/websites/${encodeURIComponent(websiteId)}/versions/${encodeURIComponent(versionId)}/${decision}`,
    { method: 'POST', cache: 'no-store' },
  );
  const body: unknown = await response.json();
  if (!response.ok) throw new Error('La décision n’a pas pu être enregistrée.');
  return websiteVersionResponseSchema.parse(body);
}

export async function startDesignReview(
  websiteId: string,
  versionId: string,
): Promise<CreateDesignReviewResponse> {
  const response = await fetch(
    `${getApiUrl()}/websites/${encodeURIComponent(websiteId)}/versions/${encodeURIComponent(versionId)}/design-review`,
    { method: 'POST', cache: 'no-store' },
  );
  const body: unknown = await response.json();
  if (!response.ok) throw new Error('L’analyse design n’a pas pu démarrer.');
  return createDesignReviewResponseSchema.parse(body);
}

export async function getDesignReviews(
  websiteId: string,
  versionId: string,
): Promise<DesignReviewListResponse> {
  return designReviewListResponseSchema.parse(
    await getJson(
      `/websites/${encodeURIComponent(websiteId)}/versions/${encodeURIComponent(versionId)}/design-reviews`,
    ),
  );
}

export async function startQualityReview(
  websiteId: string,
  versionId: string,
): Promise<CreateQualityReviewResponse> {
  const response = await fetch(
    `${getApiUrl()}/websites/${encodeURIComponent(websiteId)}/versions/${encodeURIComponent(versionId)}/quality`,
    { method: 'POST', cache: 'no-store' },
  );
  const body: unknown = await response.json();
  if (!response.ok) throw new Error('L’audit qualité n’a pas pu démarrer.');
  return createQualityReviewResponseSchema.parse(body);
}
export async function getQualityReports(
  websiteId: string,
  versionId: string,
): Promise<QualityReportListResponse> {
  return qualityReportListResponseSchema.parse(
    await getJson(
      `/websites/${encodeURIComponent(websiteId)}/versions/${encodeURIComponent(versionId)}/quality-reports`,
    ),
  );
}
