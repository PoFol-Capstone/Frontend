export type RecruitmentRole = {
  role: string;
  current: number;
  total: number;
};

export type Post = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  author: string;
  viewCount: number;
  likeCount: number;
  recruitmentRoles: RecruitmentRole[];
};