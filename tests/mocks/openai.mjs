// openai 대역 — 네트워크 호출 없이 고정 응답을 돌려주고 호출 횟수만 센다.
const state = (globalThis.__openaiMock ??= {
  calls: 0,
  content: JSON.stringify({ projectDescription: "설명", mainFeatures: "기능" }),
});

export function openaiCalls() {
  return state.calls;
}

export function resetOpenaiCalls() {
  state.calls = 0;
}

export default class OpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: async () => {
          state.calls += 1;
          return { choices: [{ message: { content: state.content } }] };
        },
      },
    };
  }
}
