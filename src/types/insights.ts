export type InsightType = 'alert' | 'info' | 'success' | 'warning';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  priority: number; // Higher number = higher priority
  actionLabel?: string;
  actionRoute?: string;
  icon?: string;
}
