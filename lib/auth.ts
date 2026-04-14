const BASE_URL = "http://localhost:8080";

//백엔드 서버 연결 전 임시 테스트용 fake auth
//실제 API를 호출하지 않고 OTP 발송, 검증이 성공한 것처럼 처리
//추후에 fetch 코드로 교체 예정

export async function sendOtp(email: string) {
  console.log("OTP 요청 (fake):", email);
  return "ok";
}

export async function verifyOtp(email: string, code: string) {
  console.log("OTP 확인 (fake):", email, code);

  return {
    verified: true,
    newUser: false,
  };
}

/*
백엔드 연결 후 실제 API 요청 코드
export async function verifyOtp(email: string, code: string) {
  const res = await fetch(`${BASE_URL}/api/auth/email/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!res.ok) {
    throw new Error("인증 코드 확인 실패");
  }

  return res.json() as Promise<{
    verified: boolean;
    newUser: boolean;
  }>;
}
*/