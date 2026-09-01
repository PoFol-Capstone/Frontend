import type { Skill } from "./skill";

export enum PostType {
  RECRUIT = "RECRUIT",
  DISPLAY = "DISPLAY",
}

export enum LinkType {
  GITHUB = "GITHUB",
  DEPLOY = "DEPLOY",
  FIGMA = "FIGMA",
  ERD = "ERD",
  CLASS = "CLASS",
  EXTRA = "EXTRA",
}

export type PostLink = {
  type: LinkType;
  url: string;
};

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
  thumbnailUrl?: string | null;
  type: PostType;
  links: PostLink[];
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
  links: PostLink[];
  recruitNote: string;
  recruitPositionInfos: RecruitPositionResponse[];
  totalApplicantCount: number;
  viewCount: number;
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  /** 조회자가 이 글의 작성자를 팔로우 중인지 (비로그인/본인 글이면 false) */
  isAuthorFollowed: boolean;
  isPublished: boolean;
  skills: Skill[];
  tags: string[];
  createdAt: string;
};

export type PostListParams = {
  page?: number;
  size?: number;
  type?: PostType;
  tagId?: number;
  skillId?: number;
  authorUuid?: string;
};

export type PagedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
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

export type ApplicantResponse = {
  applyUuid: string;
  applicantUuid: string;
  applicantName: string;
  applicantSkills: string[];
  positionType: string;
  introduction: string;
  portfolioUrl?: string;
  status: ApplicationStatus;
};
