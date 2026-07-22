// 백엔드 application.properties의 jwt.access-token-expiration / jwt.refresh-token-expiration과
// 반드시 일치해야 함. 쿠키 maxAge(초 단위)가 실제 JWT 만료 시간보다 짧거나 길면
// "아직 유효한 토큰인데 쿠키가 먼저 사라짐" 또는 그 반대 상황이 생김.
export const ACCESS_TOKEN_MAX_AGE = 60 * 60; // 1시간 (jwt.access-token-expiration=3600000)
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14; // 14일 (jwt.refresh-token-expiration=1209600000)
