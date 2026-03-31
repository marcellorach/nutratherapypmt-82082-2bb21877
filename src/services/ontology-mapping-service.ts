/**
 * Ontology Mapping Service
 * Maps entities to SNOMED-CT and UMLS standards with audit trail and deduplication
 */

import { supabase } from '@/integrations/supabase/client';

export interface MappingResult {
  cui?: string;
  snomed_code?: string;
  name: string;
  source: string;
  source_metadata?: Record<string, unknown>;
}

export interface MappingPreview {
  entityId: string;
  entityName: string;
  table: string;
  currentSnomed: string | null;
  currentUmls: string | null;
  suggestedSnomed: string | null;
  suggestedUmls: string | null;
  suggestedName: string | null;
  duplicateWarning: string | null;
  status: 'new' | 'update' | 'duplicate' | 'no_match';
}

export interface MappingStats {
  total: number;
  mapped: number;
  unmapped: number;
  snomedOnly: number;
  umlsOnly: number;
  both: number;
}

type MappableTable = 'health_conditions' | 'nutraceuticals';

// Search for UMLS/SNOMED mappings via edge function
export async function searchStandardMappings(
  name: string,
  source: 'umls' | 'snomed' = 'umls',
  limit = 5
): Promise<MappingResult[]> {
  const { data, error } = await supabase.functions.invoke('fetch-external-ontologies', {
    body: { query: name, source, limit }
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);

  return (data.results || []).map((r: Record<string, unknown>) => ({
    cui: (r.source_metadata as Record<string, unknown>)?.cui as string || (r.source === 'UMLS' ? r.external_id : undefined),
    snomed_code: (r.source_metadata as Record<string, unknown>)?.snomed_code as string || (r.source?.toString().includes('SNOMED') ? r.external_id : undefined),
    name: r.name as string,
    source: r.source as string,
    source_metadata: r.source_metadata as Record<string, unknown>
  }));
}

// Check if a SNOMED/UMLS code is already assigned to another entity
export async function checkDuplicateMapping(
  table: MappableTable,
  snomedCode?: string | null,
  umlsCui?: string | null,
  excludeId?: string
): Promise<{ isDuplicate: boolean; existingEntity?: { id: string; name: string; code: string; codeType: string } }> {
  if (!snomedCode && !umlsCui) return { isDuplicate: false };

  // Check SNOMED duplicate
  if (snomedCode) {
    let query = supabase
      .from(table)
      .select('id, name')
      .eq('snomed_code', snomedCode)
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      return {
        isDuplicate: true,
        existingEntity: { id: data[0].id, name: data[0].name, code: snomedCode, codeType: 'SNOMED' }
      };
    }
  }

  // Check UMLS duplicate
  if (umlsCui) {
    let query = supabase
      .from(table)
      .select('id, name')
      .eq('umls_cui', umlsCui)
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      return {
        isDuplicate: true,
        existingEntity: { id: data[0].id, name: data[0].name, code: umlsCui, codeType: 'UMLS' }
      };
    }
  }

  return { isDuplicate: false };
}

// Save mapping with full audit trail
export async function saveMapping(
  entityId: string,
  table: MappableTable,
  snomedCode: string | null,
  umlsCui: string | null,
  mappingSource: string,
  userId?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ontology_mapping_source: mappingSource,
    ontology_mapped_at: new Date().toISOString(),
    ontology_mapped_by: userId || null
  };

  if (snomedCode !== undefined) updateData.snomed_code = snomedCode;
  if (umlsCui !== undefined) updateData.umls_cui = umlsCui;

  const { error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', entityId);

  if (error) throw error;
}

// Get mapping stats for a table
export async function getMappingStats(table: MappableTable): Promise<MappingStats> {
  const { data, error } = await supabase
    .from(table)
    .select('id, snomed_code, umls_cui');

  if (error) throw error;

  const entities = data || [];
  const stats: MappingStats = {
    total: entities.length,
    mapped: 0,
    unmapped: 0,
    snomedOnly: 0,
    umlsOnly: 0,
    both: 0
  };

  for (const e of entities) {
    const hasSnomed = !!e.snomed_code;
    const hasUmls = !!e.umls_cui;

    if (hasSnomed && hasUmls) {
      stats.both++;
      stats.mapped++;
    } else if (hasSnomed) {
      stats.snomedOnly++;
      stats.mapped++;
    } else if (hasUmls) {
      stats.umlsOnly++;
      stats.mapped++;
    } else {
      stats.unmapped++;
    }
  }

  return stats;
}

// Batch map unmapped entities — returns preview (doesn't save)
export async function batchMapUnmapped(
  table: MappableTable,
  batchSize = 10
): Promise<MappingPreview[]> {
  // Get unmapped entities
  const { data: unmapped, error } = await supabase
    .from(table)
    .select('id, name, snomed_code, umls_cui')
    .is('snomed_code', null)
    .is('umls_cui', null)
    .limit(batchSize);

  if (error) throw error;
  if (!unmapped || unmapped.length === 0) return [];

  const previews: MappingPreview[] = [];

  for (const entity of unmapped) {
    try {
      const results = await searchStandardMappings(entity.name, 'umls', 1);

      if (results.length === 0) {
        previews.push({
          entityId: entity.id,
          entityName: entity.name,
          table,
          currentSnomed: entity.snomed_code,
          currentUmls: entity.umls_cui,
          suggestedSnomed: null,
          suggestedUmls: null,
          suggestedName: null,
          duplicateWarning: null,
          status: 'no_match'
        });
        continue;
      }

      const best = results[0];
      const dupCheck = await checkDuplicateMapping(table, best.snomed_code, best.cui, entity.id);

      previews.push({
        entityId: entity.id,
        entityName: entity.name,
        table,
        currentSnomed: entity.snomed_code,
        currentUmls: entity.umls_cui,
        suggestedSnomed: best.snomed_code || null,
        suggestedUmls: best.cui || null,
        suggestedName: best.name,
        duplicateWarning: dupCheck.isDuplicate
          ? `${dupCheck.existingEntity?.codeType} ${dupCheck.existingEntity?.code} já atribuído a "${dupCheck.existingEntity?.name}"`
          : null,
        status: dupCheck.isDuplicate ? 'duplicate' : 'new'
      });
    } catch (err) {
      console.error(`Failed to map ${entity.name}:`, err);
      previews.push({
        entityId: entity.id,
        entityName: entity.name,
        table,
        currentSnomed: entity.snomed_code,
        currentUmls: entity.umls_cui,
        suggestedSnomed: null,
        suggestedUmls: null,
        suggestedName: null,
        duplicateWarning: null,
        status: 'no_match'
      });
    }
  }

  return previews;
}

// Check UMLS API status
export async function checkApiStatus(): Promise<Record<string, { configured: boolean; name: string; message?: string }>> {
  const { data, error } = await supabase.functions.invoke('fetch-external-ontologies', {
    body: { action: 'check_status', query: '_', source: 'all' }
  });

  if (error) throw error;
  return data.sources || {};
}
