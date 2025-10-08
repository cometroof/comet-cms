export interface DashboardStats {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend: string;
}

export interface RecentArticle {
  title: string;
  status: 'Published' | 'Draft';
  date: string;
  views: number;
}