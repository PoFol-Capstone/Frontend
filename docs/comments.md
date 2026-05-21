프론트 API 연동 정리
타입 정의

interface Author {
uuid: string;
name: string;
}

interface Comment {
uuid: string;
content: string; // deleted=true면 "삭제된 댓글입니다."
author: Author;
deleted: boolean;
likeCount: number;
replies: Comment[]; // 대댓글 (최대 1단계, 항상 배열로 옴)
createdAt: string; // ISO 8601
}
엔드포인트

1. 댓글 목록 조회

GET /api/posts/{postUuid}/comments

// 응답: Comment[]
// replies가 이미 중첩되어 있으므로 별도 가공 없이 바로 렌더링 가능 2. 댓글 작성 (최상위)

POST /api/posts/{postUuid}/comments
Content-Type: application/json

{ "content": "댓글 내용" } 3. 대댓글 작성

POST /api/posts/{postUuid}/comments
Content-Type: application/json

{ "content": "대댓글 내용", "parentUuid": "부모댓글의 uuid" }
parentUuid는 최상위 댓글의 uuid만 가능. 대댓글의 uuid를 넣으면 400 에러.

4. 댓글 수정

PATCH /api/comments/{commentUuid}
Content-Type: application/json

{ "content": "수정된 내용" } 5. 좋아요 토글

POST /api/comments/{commentUuid}/like

// 응답: { liked: boolean }
// true = 좋아요 등록, false = 좋아요 취소 6. 댓글 삭제

DELETE /api/comments/{commentUuid}

// 응답: 204 No Content
// 대댓글이 있는 댓글은 서버에서 자동으로 "삭제된 댓글입니다."로 표시
렌더링 주의사항
상황 처리
deleted: true 작성자 정보 숨기고 내용을 회색으로 표시
replies: [] 대댓글 영역 숨기거나 "답글 달기" 버튼만 노출
좋아요 토글 응답의 liked 값으로 UI 상태 교체 (낙관적 업데이트 권장)
인증 필요 API 작성/수정/삭제/좋아요는 JWT 토큰 헤더 필수
