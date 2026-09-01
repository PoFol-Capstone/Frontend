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
  /** 조회한 사람이 이 유저를 팔로우 중인지. 비로그인/본인 프로필이면 false. */
  isFollowing: boolean;
  links: ProfileLink[];
  skills: ProfileSkill[];
};

// 백엔드 FollowUserResponse와 1:1 대응.
// 예전 타입은 `id: number`로 선언돼 있었지만 서버는 `uuid`를 보내서
// key/팔로우 토글에 쓰던 user.id가 런타임에 전부 undefined였다.
export type FollowerUser = {
  uuid: string;
  name: string;
  avatarUrl: string | null;
  isFollowing: boolean;
};

export type ProfileUpdateRequest = {
  name: string;
  bio: string;
  position: string;
  positionMonths: number;
  portfolioUrl: string;
};