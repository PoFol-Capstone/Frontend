export type ProfileLink = {
  url: string;
  type: string;
  iconSlug: string;
};

export type ProfileSkill = {
  id: number;
  name: string;
  iconSlug: string;
  badgeColor: string;
};

export type Profile = {
  uuid: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  position: string;
  positionMonths: number;
  totalViewCount: number;
  followerCount: number;
  links: ProfileLink[];
  skills: ProfileSkill[];
};

export type FollowerUser = {
  id: number;
  name: string;
  isFollowing: boolean;
};

export type ProfileUpdateRequest = {
  name: string;
  bio: string;
  position: string;
  positionMonths: number;
  portfolioUrl: string;
};