export type EquipmentStatus = "발표" | "출시 예정" | "출시 완료";

export interface EquipmentItem {
  id: string;
  brand: string;
  model: string;
  category: string;
  announced_at: string;
  release_date?: string | null;
  status: EquipmentStatus;
  summary: string;
  official_url?: string | null;
  manual_url?: string | null;
  firmware_url?: string | null;
  featured?: boolean;
  is_published?: boolean;
  source_title?: string | null;
}
