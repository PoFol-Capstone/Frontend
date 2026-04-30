export enum PostType {
  RECRUIT = "RECRUIT",
  DISPLAY = "DISPLAY",
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

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

export type RequestPosts = {
  title: string;
  content: string;
  thumbnailUrl: string;
  type: PostType;
  repoUrl: string;
  deployUrl: string;
  isRecruiting: boolean;
  recruitPosition: string;
  recruitNote: string;
  isPublished: boolean;
  skillIds: number[];
  tagNames: string[];
};

export type ResponsePosts = {
  uuid: string;
  title: string;
  content: string;
  thumbnailUrl: string;
  postType: PostType;
  authorName: string;
  authorUuid: string;
  repoUrl: string;
  deployUrl: string;
  isRecruiting: boolean;
  recruitPosition: string;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  skills: string[];
  tags: string[];
  createdAt: string;
};

export type PostListParams = {
  type?: PostType;
  tag?: string;
  skill?: string;
};

export type RequestApplication = {
  position: string;
  message: string;
};

export type ResponseApplication = {
  id: number;
  postId: string;
  userId: string;
  applicantName: string;
  applicantUuid: string;
  avatarUrl: string;
  position: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type PatchApplicationStatus = {
  status: "accepted" | "rejected";
};
