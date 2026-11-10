import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateJobs, classifyRole, isKoreaLocation, summarizeJobs, type JobPosting, type JobTrendSnapshot } from "@/lib/jobTrends";

test("classifyRole — 실제 공고 제목에서 틀렸던 경우들", () => {
  assert.equal(classifyRole("Software Engineer, Frontend - 커뮤니티"), "frontend");
  assert.equal(classifyRole("Software Engineer, Backend - 피드 (피드 인프라)"), "backend"); // 백엔드가 인프라보다 먼저
  assert.equal(classifyRole("[AI Frontier Div.] AI Native Full Stack Engineer"), "data"); // Frontier ≠ Front-end
  assert.equal(classifyRole("Director of Engineering, Fulfillment Optimization"), "backend"); // Fulfillment 속 llm 아님
  assert.equal(classifyRole("Senior Staff Security Engineer, Mobile Security"), "infra"); // 보안이 모바일보다 먼저
  assert.equal(classifyRole("[쿠팡페이] Staff iOS Engineer (Core Payment)"), "mobile");
  assert.equal(classifyRole("Machine Learning Engineer Intern"), "data");
});

test("classifyRole — 개발 공고가 아니면 null", () => {
  assert.equal(classifyRole("[쿠팡] 이츠 사업개발 및 제휴 팀장"), null); // 개발 단어 없음
  assert.equal(classifyRole("[쿠팡풀필먼트서비스] HVAC (냉난방공조) 설계 엔지니어"), null);
  assert.equal(classifyRole("Robotics Hardware Engineer"), null);
  assert.equal(classifyRole("Senior Product Manager (Finance Platform & Accounting Engineering)"), null);
  assert.equal(classifyRole("Data Governance Manager"), null); // 부서명만 데이터 — 제목에 개발 단어 없음
});

test("isKoreaLocation", () => {
  assert.equal(isKoreaLocation("Seoul, South Korea"), true);
  assert.equal(isKoreaLocation("판교"), true);
  assert.equal(isKoreaLocation("Tokyo, Japan"), false);
});

const posting = (role: JobPosting["role"], required: string[], preferred: string[], mentioned: string[] = []): JobPosting => ({
  company: "당근",
  title: "",
  url: "",
  role,
  required,
  preferred,
  mentioned,
});

test("aggregateJobs — 직군별 · 전체 집계, 구역 못 찾은 공고 수", () => {
  const agg = aggregateJobs([
    posting("backend", ["java", "spring"], ["kafka"]),
    posting("backend", ["java"], ["kafka", "kubernetes"]),
    posting("frontend", ["react"], ["ssr"]),
    posting("data", [], [], ["python"]),
  ]);
  assert.equal(agg.roles.backend.postings, 2);
  assert.deepEqual(agg.roles.backend.required, [{ id: "java", count: 2 }, { id: "spring", count: 1 }]);
  assert.deepEqual(agg.roles.backend.preferred[0], { id: "kafka", count: 2 });
  assert.equal(agg.roles.mobile.postings, 0);
  assert.equal(agg.all.postings, 4);
  assert.equal(agg.unsectioned, 1);
});

const snap = (period: string, kafka: number, total: number): JobTrendSnapshot => {
  const postings = Array.from({ length: total }, (_, i) => posting("backend", ["java"], i < kafka ? ["kafka"] : []));
  return {
    period,
    collectedAt: "",
    source: "Greenhouse Job Board API",
    sources: [{ company: "당근", url: "", postings: total }, { company: "몰로코", url: "", postings: 0, error: "Error: 500" }],
    ...aggregateJobs(postings),
    postings,
  };
};

test("summarizeJobs — 지난달 대비 %p, 표본 적음 · 수집 실패 표시, 디스코드 2000자 안쪽", () => {
  const first = summarizeJobs(snap("2026-11", 2, 10), null);
  assert.match(first, /첫 수집/);
  assert.match(first, /몰로코 ⚠️수집 실패/);
  assert.match(first, /백엔드 · SW 10건 \(표본 적음\)/);
  assert.match(first, /우대 Kafka 20%/);

  const next = summarizeJobs(snap("2026-12", 5, 25), snap("2026-11", 2, 10));
  assert.match(next, /Kafka 20% \(\+0%p\)/); // 5/25 = 20%, 지난달 2/10 = 20%
  assert.ok(!/표본 적음/.test(next));
  assert.ok(next.length < 1900);
});
