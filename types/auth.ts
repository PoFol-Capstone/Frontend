export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  uuid: string;
  name: string;
};

export type RefreshResponse = {
  accessToken: string;
};
