import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getJob, isWatched, jobKey, markJobSeen, startJob, watchJob } from "@/lib/aiCardJobs";
import type { Project } from "@/types/project";

const settle = () => new Promise((r) => setTimeout(r, 0));

describe("프로젝트 AI 작업 스토어", () => {
  it("프로젝트 · 탭마다 따로 돌고, 같은 작업은 두 번 시작하지 않는다", async () => {
    let calls = 0;
    let finish!: (v: { project: Project; notice: string }) => void;
    const task = () => {
      calls++;
      return new Promise<{ project: Project; notice: string }>((r) => (finish = r));
    };
    const key = jobKey("p1", "interview");
    startJob("p1", "me/repo", "interview", task);
    startJob("p1", "me/repo", "interview", task);
    assert.equal(calls, 1);
    assert.equal(getJob(key)?.status, "running");

    startJob("p1", "me/repo", "explain", async () => ({ error: "실패" }));
    finish({ project: { uuid: "p1" } as Project, notice: "변경 없음" });
    await settle();
    assert.equal(getJob(key)?.status, "done");
    assert.equal(getJob(jobKey("p1", "explain"))?.status, "error");

    // 탭이 결과를 받으면 seen — 알림엔 안 뜨고 notice만 남는다
    markJobSeen(key);
    assert.equal(getJob(key)?.status, "seen");
    assert.equal(getJob(key)?.notice, "변경 없음");
    assert.equal(getJob(key)?.project, undefined);
  });

  it("task가 던져도 error로 끝난다", async () => {
    startJob("p3", "me/repo", "card", async () => {
      throw new Error("network");
    });
    await settle();
    assert.equal(getJob(jobKey("p3", "card"))?.status, "error");
  });

  it("watch 중인지 키 단위로 센다", () => {
    const key = jobKey("p2", "techReco");
    const stop = watchJob(key);
    assert.equal(isWatched(key), true);
    assert.equal(isWatched(jobKey("p2", "card")), false);
    stop();
    assert.equal(isWatched(key), false);
  });
});
