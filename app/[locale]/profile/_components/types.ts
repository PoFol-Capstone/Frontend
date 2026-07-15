export type ProfilePost = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  content?: string;
  skills?: { id: number; name: string; badgeColor: string }[];
  tags?: string[];
};
