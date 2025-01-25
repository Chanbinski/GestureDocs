export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SidebarOption {
  id: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  content: React.ReactNode;
  isActive?: boolean;
} 