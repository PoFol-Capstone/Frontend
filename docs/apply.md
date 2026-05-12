Apply API 명세서
공통 사항
Base URL: /api
인증: 모든 엔드포인트에 JWT Bearer 토큰 필요
Content-Type: application/json

1. ApplyController — /api/posts/{postUuid}
   1-1. 지원서 제출

POST /api/posts/{postUuid}/apply
Request Body

{
"positionType": "FRONTEND" | "BACKEND" | "DESIGNER", // 필수
"introduction": "string (max 500)", // 필수
"portfolioUrl": "string" // 선택
}
Response 201 Created

{
"uuid": "uuid",
"positionType": "FRONTEND",
"introduction": "string",
"portfolioUrl": "string | null",
"status": "PENDING",
"createdAt": "2026-05-08T12:00:00"
}
에러 케이스

본인 게시물에 지원 시 → 400
이미 지원한 경우 → 400
존재하지 않는 포지션 → 400
해당 포지션 모집 완료 → 400
1-2. 내 지원서 조회

GET /api/posts/{postUuid}/apply
Response 200 OK — ApplyResponse (위와 동일)

1-3. 지원서 수정

PUT /api/posts/{postUuid}/apply
Request Body

{
"introduction": "string (max 500)", // 필수
"portfolioUrl": "string" // 선택
}
Response 200 OK — ApplyResponse

주의: status가 PENDING일 때만 수정 가능. ACCEPTED/REJECTED면 400

1-4. 지원서 취소

DELETE /api/posts/{postUuid}/apply
Response 204 No Content

주의: status가 PENDING일 때만 취소 가능

1-5. 지원자 목록 조회 (게시물 작성자 전용)

GET /api/posts/{postUuid}/applicants
Response 200 OK

[
{
"applyUuid": "uuid",
"applicantUuid": "uuid",
"applicantName": "string",
"applicantSkills": [], // 현재 빈 배열 (추후 구현 예정)
"positionType": "BACKEND",
"introduction": "string",
"portfolioUrl": "string | null",
"status": "PENDING" | "ACCEPTED" | "REJECTED"
}
]
1-6. 지원자 수락 (게시물 작성자 전용)

PUT /api/posts/{postUuid}/applicants/{applyUuid}/accept
Response 200 OK

1-7. 지원자 거절 (게시물 작성자 전용)

PUT /api/posts/{postUuid}/applicants/{applyUuid}/reject
Response 200 OK

2. RecruitmentController — /api/recruitment
   2-1. 내 모집글 목록 조회

GET /api/recruitment/posts
Response 200 OK — PostResponse[]

특징: isPublished=true인 RECRUIT 타입 포스트만 반환, createdAt 내림차순

프론트엔드 구현 가이드
역할 분기 핵심 포인트
상황 호출할 API
게시물 상세 진입 (지원자 본인) GET /apply → 지원 여부 확인 후 버튼 표시
지원 모달 submit POST /apply
지원서 수정 모달 PUT /apply (status === PENDING일 때만 활성화)
지원 취소 버튼 DELETE /apply (status === PENDING일 때만 활성화)
게시물 작성자가 상세 진입 GET /applicants
작성자가 수락/거절 버튼 클릭 `PUT /applicants/{applyUuid}/accept
마이페이지 "내 모집글" 탭 GET /api/recruitment/posts
상태값 처리

type ApplyStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type PositionType = 'FRONTEND' | 'BACKEND' | 'DESIGNER';
PENDING: 수정/취소 버튼 활성화
ACCEPTED/REJECTED: 버튼 비활성화, 상태 배지만 표시
주의사항
applicantSkills는 현재 항상 빈 배열([])로 내려옵니다 — 백엔드에서 아직 미구현
모집 포지션 선택 시 해당 게시물의 recruitPositions에 있는 값만 선택지로 제공해야 합니다
