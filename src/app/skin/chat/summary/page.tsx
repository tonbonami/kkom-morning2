'use client';
// 「오늘 상담 정리」 화면 — 겉모습은 SkinChatSummaryView(제미나이 7차, 값 그대로), 여기선 데이터·고치기·반영만.
// 우댕 2026-10-21: "대화 하고 나서 오늘 상담 정리하기를 누르면 일목요연하게 정리 → 일지에 반영할까요 → 고칠 게 있으면 고쳐서(2알 → 3알)"
// 꼼이: 처음 열면 Claude가 정리(20~40초) → 켜고 고르고 고친 것만 반영. 반영한 날은 다시 볼 수만(같은 걸 두 번 더하지 않게).
// 우댕 폰: 정리가 있으면 읽기만.
// 2026-10-24: 가려움·붉어짐 0~10(팽진 없앰), 메모 후보는 아침·점심·저녁·밤 칸 표시. 예전 초안의 팽진·가려움(0~3)은 그대로 보여 준다.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinChatSummaryView, { type EditValue, type MemoryRow, type SummaryItem } from '@/components/skin/SkinChatSummaryView';
import SkinScreen from '@/components/skin/SkinScreen';
import { AREAS } from '@/components/skin/skinUi';
import type { SkinLog } from '@/lib/skinTypes';
import {
  FIELD_LABEL, MEMORY_LABEL, currentValueText, slotLabel, type ApplyItem, type ChatSummary, type Proposal,
} from '@/lib/skinChatSummary';
import { addDays, applyChatSummary, fetchChatSummary, fetchSkinLogs, kstToday, makeChatSummary, skinSession, weekdayOf } from '@/lib/skinClient';

type Phase = 'loading' | 'ready' | 'error' | 'applying' | 'done';
const STATUS = { taken: '먹음', missed: '거름', late: '늦게' } as const;
const NUM: Partial<Record<Proposal['field'], { unit: string; min: number; max: number; step: number }>> = {
  itch10: { unit: '/ 10', min: 0, max: 10, step: 1 }, redness: { unit: '/ 10', min: 0, max: 10, step: 1 },
  wheals: { unit: '(0~3)', min: 0, max: 3, step: 1 }, itch: { unit: '(0~3)', min: 0, max: 3, step: 1 },
  sleepH: { unit: '시간', min: 0, max: 16, step: 0.5 }, waterMl: { unit: 'ml', min: 0, max: 5000, step: 250 },
  stress: { unit: '/ 10', min: 0, max: 10, step: 1 }, cycleDay: { unit: '일째', min: 1, max: 14, step: 1 },
};
const SCORE = ['없음', '약간', '보통', '심함'];

// 후보 → 고치기 칸
function toEdit(p: Proposal): EditValue {
  const n = NUM[p.field];
  if (n) return { kind: 'number', value: p.num, ...n };
  switch (p.field) {
    case 'wakeItch': case 'period': return { kind: 'bool', value: p.bool };
    case 'trace': return { kind: 'text', value: p.text ?? '', options: ['흔적 없음', '색소 남음', '긁은 상처'] };
    case 'note': return { kind: 'text', value: p.text ?? '', options: [] };
    case 'triggers': case 'newProducts': return { kind: 'list', value: p.list };
    case 'meds': return { kind: 'med', value: p.med ?? { name: '', dose: null, time: null, status: null } };
    case 'episodes': return { kind: 'episode', value: p.episode ?? { start: null, durMin: null, areas: [] }, areaOptions: AREAS };
    case 'foods': return { kind: 'food', value: p.food ?? { t: null, text: '' } };
    default: return { kind: 'angio', value: p.angio ?? { present: true, areas: [] }, areaOptions: ['입술', '눈', '목·혀'] };
  }
}

// 고친 값 → 후보(슬롯 하나만 바꿈)
function withEdit(p: Proposal, kind: EditValue['kind'], v: EditValue['value']): Proposal {
  const slot = { number: 'num', bool: 'bool', text: 'text', list: 'list', med: 'med', episode: 'episode', food: 'food', angio: 'angio' }[kind];
  return { ...p, [slot]: v };
}

// 후보 값 → 한 줄(고치면 다시 만듦)
function valueText(p: Proposal): string {
  switch (p.field) {
    case 'itch10': case 'redness': return p.num != null ? `${p.num} / 10` : '';
    case 'wheals': case 'itch': return p.num != null ? `${SCORE[p.num] ?? p.num} (${p.num})` : '';
    case 'sleepH': return p.num != null ? `${p.num}시간` : '';
    case 'waterMl': return p.num != null ? `${p.num}ml` : '';
    case 'stress': return p.num != null ? `${p.num} / 10` : '';
    case 'cycleDay': return p.num != null ? `${p.num}일째` : '';
    case 'wakeItch': case 'period': return p.bool == null ? '' : p.bool ? '예' : '아니오';
    case 'trace': return p.text ?? '';
    case 'note': return p.text ? `${slotLabel(p)} · ${p.text}` : '';
    case 'triggers': case 'newProducts': return p.list.join(', ');
    case 'meds': return p.med ? [p.med.name, p.med.dose, p.med.time, p.med.status && STATUS[p.med.status]].filter(Boolean).join(' · ') : '';
    case 'episodes': return p.episode ? [p.episode.start, p.episode.areas.join('·'), p.episode.durMin ? `${p.episode.durMin}분` : null].filter(Boolean).join(' · ') : '';
    case 'foods': return p.food ? [p.food.t, p.food.text].filter(Boolean).join(' · ') : '';
    case 'angioedema': return p.angio ? (p.angio.present ? `있음 ${p.angio.areas.join('·')}` : '없음') : '';
  }
}
const labelOf = (p: Proposal) => `${FIELD_LABEL[p.field]} — ${valueText(p)}`;

type Row = { p: Proposal; on: boolean; mode: 'replace' | 'note' };

export default function SkinChatSummaryPage() {
  const router = useRouter();
  const today = useMemo(() => kstToday(), []);
  const [date, setDate] = useState(today);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorText, setErrorText] = useState<string | undefined>();
  const [readOnly, setReadOnly] = useState(true);
  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [mem, setMem] = useState<{ kind: ChatSummary['memory'][number]['kind']; text: string; on: boolean }[]>([]);
  const [logs, setLogs] = useState<Record<string, SkinLog>>({});

  const show = useCallback((s: ChatSummary) => {
    setSummary(s);
    if (s.status === 'applied' && s.appliedItems) {
      // 반영한 날은 「실제로 한 것」(고친 값·고른 날짜·바꾸기/메모)만 — Aside 3차: 처음 제안값이 다시 보였다
      setRows(s.appliedItems.map((it) => ({ p: it.proposal, on: true, mode: it.mode })));
      setMem((s.appliedMemory ?? []).map((m) => ({ ...m, on: true })));
      setPhase('ready');
      return;
    }
    // 확실한 것만 처음부터 켜 둔다(짐작은 꺼진 채로 보여 줌)
    setRows(s.proposals.map((p) => ({ p, on: p.certain, mode: 'replace' })));
    setMem(s.memory.map((m) => ({ ...m, on: true })));
    setPhase('ready');
  }, []);

  const generate = useCallback(async (d: string) => {
    setPhase('loading');
    try {
      const r = await makeChatSummary(d);
      show(r.summary);
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      setErrorText(code === 'no_messages' ? '이 날은 상담한 내용이 없어요.' : 'Claude와 연결이 안 됐어요. 잠시 뒤 다시 해 주세요.');
      setPhase('error');
    }
  }, [show]);

  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get('date');
    const d = asked && /^\d{4}-\d{2}-\d{2}$/.test(asked) && asked <= today ? asked : today;
    setDate(d);
    (async () => {
      const s = await skinSession();
      if (!s.authed) { router.replace('/skin'); return; }
      const ro = s.role !== 'kkomi';
      setReadOnly(ro);
      const [got, list] = await Promise.all([fetchChatSummary(d), fetchSkinLogs(addDays(d, -6), d)]);
      setLogs(Object.fromEntries((list ?? []).map((l) => [l.date, l])));
      // 반영한 뒤에 상담을 더 했으면 새로 정리(일지에 이미 들어간 값은 Claude가 빼고 뽑는다)
      const stale = got?.summary?.status === 'applied' && (got.msgCount ?? 0) > got.summary.msgCount;
      if (got?.summary && !(stale && !ro)) show(got.summary);
      else if (ro) { setErrorText('아직 오늘 상담을 정리하지 않았어요.'); setPhase('error'); }
      else void generate(d);
    })().catch(() => { setErrorText('불러오지 못했어요. 잠시 뒤 다시 해 주세요.'); setPhase('error'); });
  }, [today, router, show, generate]);

  const applied = summary?.status === 'applied';
  const locked = readOnly || applied;

  const items: SummaryItem[] = rows.map((r, i) => {
    const cur = r.p.date ? currentValueText(logs[r.p.date], r.p) : null;
    return {
      id: String(i), fieldLabel: FIELD_LABEL[r.p.field], label: labelOf(r.p), evidence: r.p.evidence, certain: r.p.certain,
      date: r.p.date, current: !locked && cur && cur !== valueText(r.p) ? cur : null, on: r.on, mode: r.mode, edit: toEdit(r.p),
    };
  });
  const memory: MemoryRow[] = mem.map((m, i) => ({ id: String(i), kindLabel: MEMORY_LABEL[m.kind], text: m.text, on: m.on }));
  const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
  const dateChoices = [0, -1, -2].map((n) => addDays(date, n)).map((d, i) => ({
    value: d, label: date === today ? ['오늘', '어제', '그저께'][i] : md(d),
  }));
  const setRow = (id: string, f: (r: Row) => Row) => setRows((rs) => rs.map((r, i) => (String(i) === id ? f(r) : r)));

  const onApply = async () => {
    const chosen = rows.filter((r) => r.on);
    if (chosen.some((r) => !r.p.date)) { window.alert('날짜를 고르지 않은 항목이 있어요. 날짜를 골라 주세요.'); return; }
    setPhase('applying');
    const list: ApplyItem[] = chosen.map((r) => ({ proposal: { ...r.p, label: labelOf(r.p) }, mode: r.mode }));
    const ok = await applyChatSummary(date, list, mem.filter((m) => m.on).map(({ kind, text }) => ({ kind, text })))
      .catch(() => false);
    if (ok) {
      const appliedMemory = mem.filter((m) => m.on).map(({ kind, text }) => ({ kind, text }));
      setSummary((s) => (s ? { ...s, status: 'applied', appliedItems: list, appliedMemory } : s));
      setRows(list.map((it) => ({ p: it.proposal, on: true, mode: it.mode })));
      setMem(appliedMemory.map((m) => ({ ...m, on: true })));
      setPhase('done');
    }
    else { window.alert('반영하지 못했어요. 다시 눌러 주세요.'); setPhase('ready'); }
  };

  return (
    <SkinScreen>
      <SkinChatSummaryView
        dateLabel={`${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일 (${weekdayOf(date)})`}
        phase={phase}
        errorText={errorText}
        readOnly={locked}
        appliedView={applied}
        readOnlyNote={readOnly ? undefined : '이 날 정리는 일지에 반영했어요. 상담을 더 하면 새로 정리할 수 있어요.'}
        summary={summary}
        items={items}
        memory={memory}
        dateChoices={dateChoices}
        onBack={() => router.replace('/skin/chat')}
        onRegenerate={() => { if (!readOnly && (!applied || window.confirm('이미 반영한 날이에요. 다시 정리할까요? (일지는 그대로예요)'))) void generate(date); }}
        onToggleItem={(id) => !locked && setRow(id, (r) => ({ ...r, on: !r.on }))}
        onModeItem={(id, mode) => !locked && setRow(id, (r) => ({ ...r, mode }))}
        onDateItem={(id, d) => !locked && setRow(id, (r) => ({ ...r, p: { ...r.p, date: d } }))}
        onEditItem={(id, v) => !locked && setRow(id, (r) => ({ ...r, p: withEdit(r.p, toEdit(r.p).kind, v) }))}
        onToggleMemory={(id) => !locked && setMem((ms) => ms.map((m, i) => (String(i) === id ? { ...m, on: !m.on } : m)))}
        onEditMemory={(id, text) => !locked && setMem((ms) => ms.map((m, i) => (String(i) === id ? { ...m, text } : m)))}
        onApply={() => { void onApply(); }}
        onLater={() => router.replace('/skin/chat')}
        onOpenJournal={() => router.push(`/skin?date=${date}`)}
        doneList={rows.filter((r) => r.on && r.p.date).map((r) => ({ dateLabel: md(r.p.date!), text: labelOf(r.p), mode: r.mode }))}
        rememberedCount={mem.filter((m) => m.on).length}
      />
    </SkinScreen>
  );
}
