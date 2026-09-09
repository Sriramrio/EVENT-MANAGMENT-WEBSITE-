// Real backend-backed taxonomy hooks — reads directly from TaxonomyController
// (api/v1/taxonomy/segments, /categories, /categories/{key}/classifications),
// which in turn reads the Segments / MainCategories / Classifications tables
// seeded by the HSN_SAC_Public_Master_Seed package.
//
// Kept as a separate file from services/referenceData/hooks.ts (the legacy
// static-mock file) so existing consumers of that file (ProductDetailsPage,
// CapabilityWizardPages) keep working unchanged until they're migrated too.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';

export interface TaxonomySegment {
  id: string;
  segmentCode: string;
  segmentName: string;
}

export interface TaxonomyMainCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
}

export interface TaxonomyClassification {
  id: string;
  recordId: string;
  subCategory: string;
  codeSystem: 'HSN' | 'SAC' | string;
  verifiedCode: string;
  verifiedClassificationName: string;
}

// NOTE: httpClient prepends appConfig.apiBaseUrl, which already includes
// /api/v1 in this codebase's other services (e.g. '/buyer/requirements').
// TaxonomyController is routed at /api/v1/taxonomy, so if apiBaseUrl is
// ".../api/v1" the paths below should be '/taxonomy/...'. Adjust the base
// path constant below if your appConfig.apiBaseUrl differs.
const BASE = '/taxonomy';

export function useTaxonomySegments() {
  return useQuery({
    queryKey: ['taxonomy', 'segments'] as const,
    queryFn: () => httpClient.get<TaxonomySegment[]>(`${BASE}/segments`),
    staleTime: 5 * 60_000,
  });
}

export function useTaxonomyCategories(segmentKey?: string) {
  return useQuery({
    queryKey: ['taxonomy', 'categories', segmentKey] as const,
    queryFn: () =>
      segmentKey
        ? httpClient.get<TaxonomyMainCategory[]>(`${BASE}/segments/${encodeURIComponent(segmentKey)}/categories`)
        : httpClient.get<TaxonomyMainCategory[]>(`${BASE}/categories`),
    enabled: true,
    staleTime: 5 * 60_000,
  });
}

export function useTaxonomyClassifications(categoryKey?: string) {
  return useQuery({
    queryKey: ['taxonomy', 'classifications', categoryKey] as const,
    queryFn: () => httpClient.get<TaxonomyClassification[]>(`${BASE}/categories/${encodeURIComponent(categoryKey!)}/classifications`),
    enabled: Boolean(categoryKey),
    staleTime: 5 * 60_000,
  });
}

// --- Buyer requirement tag suggestions (Screen 03 — Intelligent Suggestions) ---------------
// Reads from BuyerRequirementsController's GET/PUT {id}/tags endpoints, which resolve
// ClassificationTags for whatever Classification the buyer picked on Screen 02, grouped by
// TagType. Nothing here is hardcoded on category name — it all comes straight from the DB.

export interface RequirementSuggestedTag {
  tagId: string;
  tagCode: string;
  tagName: string;
  tagGroup: string | null;
  applicabilityRole: string;
  relationshipType: string;
  uiBehaviour: string;
  confidenceScore: number;
  relevanceWeight: number;
  mandatoryStatus: string;
  editableByUser: boolean;
  selected: boolean;
}

export interface RequirementSuggestedTagGroup {
  tagTypeCode: string;
  tagTypeName: string;
  tags: RequirementSuggestedTag[];
}

export interface RequirementSuggestedTagsResponse {
  classificationCode: string | null;
  groups: RequirementSuggestedTagGroup[];
}

export function useRequirementSuggestedTags(requirementId?: string) {
  return useQuery({
    queryKey: ['buyer', 'requirements', requirementId, 'tags'] as const,
    queryFn: () => httpClient.get<RequirementSuggestedTagsResponse>(`/buyer/requirements/${requirementId}/tags`),
    enabled: Boolean(requirementId),
    staleTime: 60_000,
  });
}

export function useSaveRequirementTags(requirementId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { selectedTagIds: string[]; version: number }) =>
      httpClient.put<{ requirementId: string; selectedTagIds: string[] }>(
        `/buyer/requirements/${requirementId}/tags`,
        input
      ),
    onSuccess: () => {
      if (requirementId) {
        qc.invalidateQueries({ queryKey: ['buyer', 'requirements', requirementId, 'tags'] });
      }
    },
  });
}

// --- Seller capability tag suggestions (Step 03 — Intelligent Suggestions) -----------------
export function useCapabilitySuggestedTags(capabilityId?: string) {
  return useQuery({
    queryKey: ['seller', 'capabilities', capabilityId, 'tags'] as const,
    queryFn: () => httpClient.get<RequirementSuggestedTagsResponse>(`/seller/capabilities/${capabilityId}/tags`),
    enabled: Boolean(capabilityId && capabilityId !== 'new'),
    staleTime: 60_000,
  });
}

export function useSaveCapabilityTags(capabilityId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { selectedTagIds: string[]; version: number }) =>
      httpClient.put<{ capabilityId: string; selectedTagIds: string[] }>(
        `/seller/capabilities/${capabilityId}/tags`,
        input
      ),
    onSuccess: () => {
      if (capabilityId) {
        qc.invalidateQueries({ queryKey: ['seller', 'capabilities', capabilityId, 'tags'] });
      }
    },
  });
}