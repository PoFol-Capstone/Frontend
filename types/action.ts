/**
 * Server Action의 결과.
 *
 * Server Action에서 throw한 에러는 프로덕션 빌드에서 메시지가 지워진 채
 * 클라이언트에 도달하므로("An error occurred in the Server Components render"),
 * 사용자에게 보여줄 실패 사유는 예외가 아니라 반환값으로 전달해야 한다.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; message: string };
