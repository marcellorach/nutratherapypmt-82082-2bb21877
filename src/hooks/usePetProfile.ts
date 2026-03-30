import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PetProfileData {
  id?: string;
  name: string;
  species: string;
  breed: string;
  age_years: number;
  weight_kg: number;
  sex: 'male' | 'female';
  neutered: boolean;
  chip_number?: string;
  photo_url?: string;
  owner_name?: string;
  owner_email?: string;
  veterinarian_id?: string;
  notes?: string;
  is_demo?: boolean;
}

export interface PetConditionData {
  id?: string;
  pet_id: string;
  condition_name: string;
  condition_id?: string;
  diagnosis_date?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'monitoring';
  notes?: string;
}

export interface PetMedicationData {
  id?: string;
  pet_id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  prescribing_vet?: string;
}

export interface PetExamData {
  id?: string;
  pet_id: string;
  exam_type: string;
  exam_date?: string;
  results?: Record<string, any>;
  notes?: string;
  file_url?: string;
}

// Fetch all pet profiles for the current user
export function usePetProfiles() {
  return useQuery({
    queryKey: ['pet-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Fetch a single pet profile with all related data
export function usePetProfileDetail(petId: string | undefined) {
  return useQuery({
    queryKey: ['pet-profile', petId],
    queryFn: async () => {
      if (!petId) return null;
      const [profileRes, conditionsRes, medicationsRes, examsRes, notesRes] = await Promise.all([
        supabase.from('pet_profiles').select('*').eq('id', petId).single(),
        supabase.from('pet_conditions').select('*').eq('pet_id', petId).order('created_at', { ascending: false }),
        supabase.from('pet_medications').select('*').eq('pet_id', petId).order('created_at', { ascending: false }),
        supabase.from('pet_exams').select('*').eq('pet_id', petId).order('exam_date', { ascending: false }),
        supabase.from('pet_clinical_notes').select('*').eq('pet_id', petId).order('created_at', { ascending: false }),
      ]);
      if (profileRes.error) throw profileRes.error;
      return {
        profile: profileRes.data,
        conditions: conditionsRes.data || [],
        medications: medicationsRes.data || [],
        exams: examsRes.data || [],
        clinicalNotes: notesRes.data || [],
      };
    },
    enabled: !!petId,
  });
}

// Create a new pet profile
export function useCreatePetProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: PetProfileData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('pet_profiles')
        .insert({
          ...data,
          created_by: user.user?.id,
          veterinarian_id: data.veterinarian_id || user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating pet profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Add a condition to a pet
export function useAddPetCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PetConditionData) => {
      const { data: result, error } = await supabase
        .from('pet_conditions')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pet-profile', variables.pet_id] });
    },
  });
}

// Add a medication to a pet
export function useAddPetMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PetMedicationData) => {
      const { data: result, error } = await supabase
        .from('pet_medications')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pet-profile', variables.pet_id] });
    },
  });
}

// Add an exam to a pet
export function useAddPetExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PetExamData) => {
      const { data: result, error } = await supabase
        .from('pet_exams')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pet-profile', variables.pet_id] });
    },
  });
}

// Add a clinical note
export function useAddClinicalNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pet_id: string; content: string; note_type: string; extracted_entities?: any; source_message?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('pet_clinical_notes')
        .insert({
          ...data,
          created_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pet-profile', variables.pet_id] });
    },
  });
}

// Delete a pet profile
export function useDeletePetProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (petId: string) => {
      const { error } = await supabase
        .from('pet_profiles')
        .delete()
        .eq('id', petId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-profiles'] });
    },
  });
}
