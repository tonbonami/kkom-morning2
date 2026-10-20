// 초진 설문 데이터 모양 — docs/gemini-skin-intake.md 와 같은 정의(제미나이 시안이 오면 그쪽 타입으로 맞춤)
export type IntakeQ = {
  id: string;
  t: 'single' | 'multi' | 'scale' | 'text' | 'long';
  q: string;
  o?: string[];
  ends?: [string, string];
  ph?: string;
  h?: string;
  req?: 1;
  miss?: 1;
  rev?: 1;
};
export type IntakeSection = { no: string; id: string; title: string; note?: string; qs: IntakeQ[] };
export type IntakeAnswer = string | string[];
