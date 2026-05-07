export enum PostType {
  RECRUIT = "RECRUIT",
  DISPLAY = "DISPLAY",
}

export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type RecruitmentRole = {
  role: string;
  current: number;
  total: number;
};

export type RecruitPositionRequest = {
  positionType: string;
  maxCount: number;
};

export type RecruitPositionResponse = {
  positionType: string;
  maxCount: number;
  currentCount: number;
  isFull: boolean;
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
  recruitNote: string;
  recruitPositions: RecruitPositionRequest[];
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
  recruitNote: string;
  recruitPositions: RecruitPositionResponse[];
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  skills: string[];
  tags: string[];
  createdAt: string;
};

export type PostListParams = {
  page?: number;
  size?: number;
  type?: PostType;
  tagId?: number;
  skillId?: number;
};

export type PagedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type RequestApplication = {
  positionType: string;
  introduction: string;
  portfolioUrl?: string;
};

export type ResponseApplication = {
  uuid: string;
  postUuid: string;
  applicantName: string;
  applicantUuid: string;
  avatarUrl: string;
  positionType: string;
  introduction: string;
  portfolioUrl?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};
