import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJobTech, findTech, htmlToText, splitSections, TECH } from "@/lib/jobTech";

// 실제 공고(당근 · 쿠팡 · 크래프톤 · 몰로코 Greenhouse)의 제목 형식을 본뜬 짧은 예문 — 원문은 저장하지 않는다

test("한국어 제목 — 자격 요건 / 우대 사항, Three.js · SSR은 우대로", () => {
  const text = [
    "팀 소개",
    "React로 결제 화면을 만들어요",
    "자격 요건",
    "TypeScript, React 개발 경험이 있으신 분",
    "우대 사항",
    "SSR(Server Side Rendering) 경험이 있으신 분",
    "Three.js로 3D 화면을 만들어 보신 분",
    "React Native 경험",
    "전형 절차",
    "Docker 과제 전형",
  ].join("\n");
  assert.deepEqual(extractJobTech(text), {
    required: ["typescript", "react"],
    preferred: ["threejs", "ssr", "react-native"],
    mentioned: [],
  });
});

test("영어 제목 — Preferred Qualifications가 Qualifications보다 먼저 걸린다", () => {
  const text = "Basic Qualifications\nJava or Kotlin with Spring Boot\nPreferred Qualifications\nKafka, Kubernetes\nAbout Moloco:\nGo Further Together";
  assert.deepEqual(extractJobTech(text), {
    required: ["java", "kotlin", "spring"],
    preferred: ["kafka", "kubernetes"],
    mentioned: [],
  });
});

test("긴 제목 안의 (필수요건) · (우대요건), 당근식 '더 좋아요'", () => {
  const krafton = "이런 경험을 가진 분과 함께 성장하고 싶습니다! (필수요건)\nPython\n이런 경험들이 있다면 저희가 찾는 그 분입니다! (우대요건)\nPyTorch";
  assert.deepEqual(extractJobTech(krafton), { required: ["python"], preferred: ["pytorch"], mentioned: [] });
  const daangn = "이런 분을 찾고 있어요\nAWS, GCP 경험\n이런 분이라면 더 좋아요!\nSpark, Kubernetes";
  assert.deepEqual(extractJobTech(daangn), { required: ["aws", "gcp"], preferred: ["spark", "kubernetes"], mentioned: [] });
});

test("필수와 우대에 다 나오면 필수로만", () => {
  assert.deepEqual(extractJobTech("자격 요건\nAWS\n우대 사항\nAWS, Terraform").preferred, ["terraform"]);
});

test("구역 제목이 없으면 추측하지 않고 mentioned로", () => {
  assert.equal(splitSections("Java 백엔드 개발자를 찾습니다\nKafka 경험"), null);
  assert.deepEqual(extractJobTech("Java 백엔드 개발자를 찾습니다\nKafka 경험"), {
    required: [],
    preferred: [],
    mentioned: ["java", "kafka"],
  });
});

test("별칭 경계 — 긴 이름이 짧은 이름을 삼킨다", () => {
  assert.deepEqual(findTech("JavaScript"), ["javascript"]);
  assert.deepEqual(findTech("React Native"), ["react-native"]);
  assert.deepEqual(findTech("MySQL, NoSQL"), ["mysql"]);
  assert.deepEqual(findTech("C++ 또는 C#"), ["cpp", "csharp"]);
  assert.deepEqual(findTech("Tailwind CSS"), ["tailwind"]);
  assert.deepEqual(findTech("GitHub Actions"), ["cicd"]);
});

test("흔한 영어 단어 — Go · Express는 대소문자까지 같아야", () => {
  assert.deepEqual(findTech("Python, Go, Java"), ["java", "python", "go"]);
  assert.deepEqual(findTech("ready to go and express ideas"), []);
  assert.deepEqual(findTech("Node.js, Express 서버"), ["nodejs", "express"]);
});

test("htmlToText — 한 번 이스케이프된 Greenhouse 본문과 그 안의 &nbsp;", () => {
  const html = "&lt;h3&gt;자격&amp;nbsp;요건&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;React&amp;nbsp;&amp;amp; Redux&lt;/li&gt;&lt;/ul&gt;";
  assert.equal(htmlToText(html), "자격 요건\nReact & Redux");
  assert.deepEqual(extractJobTech(htmlToText(html)).required, ["react", "redux"]);
});

test("테스트 — 코드 테스트 표현은 잡고 A/B 테스트(통계 실험)는 안 잡는다", () => {
  assert.deepEqual(findTech("자동화 테스트 프레임워크 경험, Pytest"), ["testing"]);
  assert.deepEqual(findTech("A/B 테스트를 설계하고 분석"), []);
});

test("사전 id는 겹치지 않는다", () => {
  assert.equal(new Set(TECH.map((t) => t.id)).size, TECH.length);
});
