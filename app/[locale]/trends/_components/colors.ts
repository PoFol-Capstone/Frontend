/** 언어별 색 — GitHub 언어 색을 따라 익숙하게. 목록에 없는 언어는 회색 */
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#e3c22b",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Go: "#00add8",
  Rust: "#c4794a",
  "C++": "#f34b7d",
  "C#": "#178600",
  Swift: "#f05138",
  Dart: "#00b4ab",
  PHP: "#4f5d95",
};

export const languageColor = (language: string) => LANGUAGE_COLORS[language] ?? "#9ca3af";
