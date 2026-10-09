/**
 * 이메일 OTP 로그인/회원가입 흐름의 sessionStorage 상태.
 *
 * 예전엔 로그인은 loginEmail, 회원가입은 signupEmail에 저장하고 인증 화면이
 * `signupEmail || loginEmail`을 썼다. A로 가입을 시작했다가 그만두고 B로 로그인하면
 * B의 OTP를 A 이메일로 검증했다. 이제 진행 중인 흐름과 이메일을 하나(authFlow·authEmail)로
 * 관리하고, 새 흐름을 시작하거나 끝낼 때 반대 흐름의 상태를 지운다.
 */

export type AuthFlow = "login" | "signup";

export type PendingAuth = {
  flow: AuthFlow;
  email: string;
  /** 회원가입 흐름에서 먼저 받은 이름. 로그인 흐름이면 빈 문자열. */
  name: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const FLOW_KEY = "authFlow";
const EMAIL_KEY = "authEmail";
const NAME_KEY = "signupName";
const CALLBACK_KEY = "callbackUrl";
// 이전 버전이 쓰던 키 — 남아 있으면 흐름이 섞이므로 시작·종료 때 함께 지운다
const LEGACY_KEYS = ["loginEmail", "signupEmail"];

function removeAll(storage: StorageLike, keys: string[]) {
  for (const key of keys) storage.removeItem(key);
}

/** 회원가입 1단계(이름 입력) */
export function saveSignupName(storage: StorageLike, name: string) {
  storage.setItem(NAME_KEY, name);
}

export function hasSignupName(storage: StorageLike): boolean {
  return !!storage.getItem(NAME_KEY)?.trim();
}

/** 로그인 화면에서 OTP를 보낸 뒤. 중단된 회원가입의 이름·이메일을 지운다. */
export function beginLoginFlow(
  storage: StorageLike,
  email: string,
  callbackUrl: string | null,
) {
  removeAll(storage, [NAME_KEY, ...LEGACY_KEYS]);
  storage.setItem(FLOW_KEY, "login");
  storage.setItem(EMAIL_KEY, email);
  if (callbackUrl) storage.setItem(CALLBACK_KEY, callbackUrl);
  else storage.removeItem(CALLBACK_KEY);
}

/**
 * 회원가입 이메일 화면에서 OTP를 보낸 뒤. 중단된 로그인의 이메일을 덮어쓴다.
 * callbackUrl은 남긴다 — 로그인 화면에서 "미가입 이메일"로 넘어온 경우 원래 가려던 곳으로 보낸다.
 */
export function beginSignupFlow(storage: StorageLike, email: string) {
  removeAll(storage, LEGACY_KEYS);
  storage.setItem(FLOW_KEY, "signup");
  storage.setItem(EMAIL_KEY, email);
}

export function readPendingAuth(storage: StorageLike): PendingAuth | null {
  const flow = storage.getItem(FLOW_KEY);
  const email = storage.getItem(EMAIL_KEY);
  if ((flow !== "login" && flow !== "signup") || !email) return null;
  return {
    flow,
    email,
    name: flow === "signup" ? (storage.getItem(NAME_KEY) ?? "") : "",
  };
}

/** 로그인하려던 이메일이 미가입이라 회원가입(이름 입력)으로 넘길 때 */
export function handOffToSignup(storage: StorageLike) {
  removeAll(storage, [FLOW_KEY, EMAIL_KEY, ...LEGACY_KEYS]);
}

/** 로그인·회원가입 성공 후 모든 흐름 상태를 지우고, 저장돼 있던 callbackUrl을 돌려준다 */
export function finishAuthFlow(storage: StorageLike): string | null {
  const callbackUrl = storage.getItem(CALLBACK_KEY);
  removeAll(storage, [FLOW_KEY, EMAIL_KEY, NAME_KEY, CALLBACK_KEY, ...LEGACY_KEYS]);
  return callbackUrl;
}
