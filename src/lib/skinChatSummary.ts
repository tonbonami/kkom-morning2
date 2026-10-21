// 「오늘 상담 정리하기」(우댕 2026-10-21) — 상담을 정리해 보여 주고, 꼼이가 고르고 고친 것만 일지에 반영 + 다음 상담에 기억.
// GPT 상담 결론: 꼼이가 직접 말한 사실만 반영 후보(Claude 제안은 참고로만), 날짜 애매하면 고르게, 기존 값과 다르면 바꾸기/메모로 남기기 선택,
// 정리는 기억의 재료일 뿐 — 꼼이가 확인한 것만 장기 기억.
// 이 파일은 타입과 합치기 규칙만(화면·서버 같이 씀). Claude에게 주는 양식(zod)은 서버 라우트에.
import type { SkinLog, MedStatus } from './skinTypes';

export const PROPOSAL_FIELDS = [
  'wheals', 'itch', 'meds', 'episodes', 'angioedema', 'trace', 'triggers', 'foods',
  'sleepH', 'wakeItch', 'waterMl', 'stress', 'period', 'cycleDay', 'newProducts', 'note',
] as const;
export type ProposalField = (typeof PROPOSAL_FIELDS)[number];

export const FIELD_LABEL: Record<ProposalField, string> = {
  wheals: '팽진', itch: '가려움', meds: '약', episodes: '두드러기 올라온 시각·부위', angioedema: '붓기', trace: '흔적',
  triggers: '의심 가는 것', foods: '먹은 것', sleepH: '잠', wakeItch: '가려워서 깸', waterMl: '물', stress: '스트레스',
  period: '생리', cycleDay: '생리 며칠째', newProducts: '새로 쓴 제품', note: '메모',
};

export type ProposalMed = { name: string; dose: string | null; time: string | null; status: MedStatus | null };
export type ProposalEpisode = { start: string | null; durMin: number | null; areas: string[] };
export type ProposalFood = { t: string | null; text: string };
export type ProposalAngio = { present: boolean; areas: string[] };

// 칸마다 값은 한 슬롯만 쓴다(num·bool·text·list·med·episode·food·angio)
export interface Proposal {
  field: ProposalField;
  date: string | null;     // 'YYYY-MM-DD' — 애매하면 null(꼼이가 고름)
  label: string;           // 화면에 보일 한 줄
  num: number | null; bool: boolean | null; text: string | null; list: string[];
  med: ProposalMed | null; episode: ProposalEpisode | null; food: ProposalFood | null; angio: ProposalAngio | null;
  evidence: string;        // 근거가 된 꼼이의 말
  certain: boolean;
}

export type MemoryKind = 'med' | 'doctor' | 'worry' | 'plan' | 'todo' | 'allergy' | 'other';
export const MEMORY_LABEL: Record<MemoryKind, string> = {
  med: '약', doctor: '의사가 한 말', worry: '걱정', plan: '해 보기로 한 것', todo: '확인할 일', allergy: '알레르기·부작용', other: '기타',
};
export interface MemoryCandidate { kind: MemoryKind; text: string }
export interface MemoryItem extends MemoryCandidate { id: string; date: string; addedAt: string }

export interface ChatSummary {
  date: string;
  status: 'draft' | 'applied';
  createdAt: string;
  msgCount: number;
  key: string[]; facts: string[]; worries: string[]; plans: string[]; claudeNotes: string[];
  proposals: Proposal[];
  memory: MemoryCandidate[];
  appliedAt?: string;
  appliedCount?: number;
}

// 반영할 때 꼼이가 고른 방식: 바꾸기(replace) · 메모로만 남기기(note). 「그대로 두기」는 아예 안 보낸다.
export interface ApplyItem { proposal: Proposal; mode: 'replace' | 'note' }

const union = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b].map((s) => s.trim()).filter(Boolean))];
const sameMed = (a: string, b: string) => a.replace(/\s+/g, '') === b.replace(/\s+/g, '');

// 이전 기록 + 고른 후보 → 저장할 바꿈(필드들). 숫자·예아니오·흔적은 바꾸고, 약은 같은 이름이면 고치고 없으면 더하고,
// 증상·먹은 것은 더하고, 의심·제품은 합치고, 메모는 덧붙인다.
export function patchFromProposals(prev: SkinLog, items: ApplyItem[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const notes: string[] = [];
  for (const { proposal: p, mode } of items) {
    if (mode === 'note') { notes.push(`[상담 정리] ${p.label}`); continue; }
    switch (p.field) {
      case 'wheals': case 'itch': case 'sleepH': case 'waterMl': case 'stress': case 'cycleDay':
        if (p.num != null) out[p.field] = p.num; break;
      case 'wakeItch': case 'period':
        if (p.bool != null) out[p.field] = p.bool; break;
      case 'trace':
        if (p.text) out.trace = p.text; break;
      case 'note':
        if (p.text) notes.push(p.text); break;
      case 'triggers': case 'newProducts':
        out[p.field] = union((out[p.field] as string[]) ?? prev[p.field], p.list); break;
      case 'meds': {
        if (!p.med?.name) break;
        const meds = [...((out.meds as SkinLog['meds']) ?? prev.meds ?? [])];
        const i = meds.findIndex((m) => sameMed(m.name, p.med!.name));
        const next = { name: p.med.name, dose: p.med.dose, time: p.med.time, status: p.med.status };
        if (i >= 0) meds[i] = { ...meds[i], ...Object.fromEntries(Object.entries(next).filter(([, v]) => v != null)) };
        else meds.push(next);
        out.meds = meds; break;
      }
      case 'episodes':
        if (p.episode) out.episodes = [...((out.episodes as SkinLog['episodes']) ?? prev.episodes ?? []), { ...p.episode }]; break;
      case 'foods':
        if (p.food?.text) out.foods = [...((out.foods as SkinLog['foods']) ?? prev.foods ?? []), { ...p.food }]; break;
      case 'angioedema':
        if (p.angio) out.angioedema = p.angio; break;
    }
  }
  if (notes.length) out.note = [prev.note, ...notes].filter(Boolean).join('\n');
  return out;
}

// 일지에 이미 적힌 값(충돌 비교·화면용 한 줄)
export function currentValueText(prev: SkinLog | null | undefined, p: Proposal): string | null {
  if (!prev) return null;
  switch (p.field) {
    case 'wheals': case 'itch': case 'sleepH': case 'waterMl': case 'stress': case 'cycleDay':
      return prev[p.field] != null ? String(prev[p.field]) : null;
    case 'wakeItch': case 'period':
      return prev[p.field] != null ? (prev[p.field] ? '예' : '아니오') : null;
    case 'trace': return prev.trace ?? null;
    case 'meds': {
      const m = (prev.meds ?? []).find((x) => p.med && sameMed(x.name, p.med.name));
      return m ? [m.name, m.dose, m.time, m.status && { taken: '먹음', missed: '거름', late: '늦게' }[m.status]].filter(Boolean).join(' · ') : null;
    }
    case 'angioedema': return prev.angioedema ? (prev.angioedema.present ? `있음 ${prev.angioedema.areas.join('·')}` : '없음') : null;
    default: return null; // 더하는 칸(증상·먹은 것·의심·제품·메모)은 충돌 없음
  }
}
