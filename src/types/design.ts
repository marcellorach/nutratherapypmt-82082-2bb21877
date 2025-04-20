
export interface DesignConvention {
  id: string;
  section: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  created_by: string | null;
}
