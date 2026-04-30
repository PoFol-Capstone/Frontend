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
  links: ProfileLink[];
  skills: ProfileSkill[];
};
