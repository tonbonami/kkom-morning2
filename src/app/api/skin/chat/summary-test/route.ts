// 임시 시험(배포 확인 뒤 바로 지움) — 상담 정리 양식이 Claude API에서 통하는지. 저장 없음, 지어낸 대화.
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import * as z from 'zod/v4';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { addDaysIso } from '@/lib/skinTypes';
import { PROPOSAL_FIELDS } from '@/lib/skinChatSummary';
import { AREAS, TRIGGERS } from '@/components/skin/skinUi';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Med = z.object({ name: z.string(), dose: z.string().nullable(), time: z.string().nullable(), status: z.enum(['taken', 'missed', 'late']).nullable() });
const Episode = z.object({ start: z.string().nullable(), durMin: z.number().nullable(), areas: z.array(z.string()) });
const Food = z.object({ t: z.string().nullable(), text: z.string() });
const Angio = z.object({ present: z.boolean(), areas: z.array(z.string()) });
const Proposal = z.object({
  field: z.enum(PROPOSAL_FIELDS), date: z.string().nullable(), label: z.string(),
  num: z.number().nullable(), bool: z.boolean().nullable(), text: z.string().nullable(), list: z.array(z.string()),
  med: Med.nullable(), episode: Episode.nullable(), food: Food.nullable(), angio: Angio.nullable(),
  evidence: z.string(), certain: z.boolean(),
});
const Output = z.object({
  key: z.array(z.string()), facts: z.array(z.string()), worries: z.array(z.string()), plans: z.array(z.string()), claudeNotes: z.array(z.string()),
  proposals: z.array(Proposal),
  memory: z.array(z.object({ kind: z.enum(['med', 'doctor', 'worry', 'plan', 'todo', 'allergy', 'other']), text: z.string() })),
});


function rules(date: string): string {
  return `너는 Anthropic이 만든 AI Claude다. 꼼이(2026년 5월부터 원인 모를 두드러기)가 ${date}에 너와 나눈 상담을 정리하고, 꼼이의 피부 일지에 넣을 후보를 뽑는다. 꼼이가 보고 고르고 고친 뒤에만 일지에 들어간다.

정리(각 줄은 짧은 한국어 한 문장, 존댓말 아닌 담백한 말투, 없으면 빈 배열)
- key: 오늘 이야기한 핵심 2~5줄
- facts: 꼼이가 말한 증상·복용·생활 사실
- worries: 꼼이의 걱정과 질문
- plans: 해 보기로 한 것, 다음에 확인할 것
- claudeNotes: Claude(너)가 설명하거나 제안한 것 — 참고용

일지 반영 후보 proposals — 아주 엄격하게
- 꼼이가 직접 말한 「있었던 사실」만. Claude의 제안·일반 설명·가정은 절대 후보가 아니다. 예: Claude가 「3알 드셔 보세요」→ 후보 아님. 꼼이가 「오늘 밤 3알 먹었어」→ 후보.
- 날짜: 「오늘」= ${date}, 「어제」= ${addDaysIso(date, -1)}, 날짜를 말했으면 그날. 애매하면 null.
- 아래 「이미 일지에 적힌 것」과 같은 값이면 빼라.
- field별 값 슬롯(나머지 슬롯은 null, list는 빈 배열):
  wheals·itch(0~3 정수: 0 없음 1 약간 2 보통 3 심함), sleepH(시간), waterMl(ml), stress(0~10), cycleDay(생리 며칠째) → num
  wakeItch(가려워서 깸), period(생리 중) → bool
  trace('흔적 없음' | '색소 남음' | '긁은 상처'), note(그 밖에 일지 메모로 남길 사실) → text
  triggers(의심 가는 것, 되도록 이 이름: ${TRIGGERS.join(', ')}), newProducts(새로 쓴 제품) → list
  meds → med {name, dose(예: '3알'), time('HH:MM' 24시간), status 'taken' 먹음 | 'missed' 거름 | 'late' 늦게}
  episodes(두드러기 올라온 때) → episode {start 'HH:MM', durMin 분, areas(이 이름 중: ${AREAS.join(', ')})}
  foods → food {t 'HH:MM' 또는 null, text}
  angioedema(붓기) → angio {present, areas(입술 · 눈 · 목·혀)}
- label: 화면에 보일 한 줄. 예: 「약 — 항히스타민제 3알 · 21:00 · 먹음」 「의심 가는 것 — 술」
- evidence: 근거가 된 꼼이의 말을 그대로 짧게 따옴.
- certain: 꼼이가 분명히 말했으면 true, 짐작해서 뽑았으면 false.

기억 후보 memory — 다음 상담에도 Claude가 알아야 할 것만(약 바꿈, 꼼이가 전한 의사의 말, 알레르기·부작용, 걱정, 해 보기로 한 것, 확인할 일). 아래 「이미 기억하는 것」에 있으면 빼라. 의사의 말은 「꼼이가 전한 의사의 말」로 쓴다.

새로 진단하거나 약을 바꾸라고 쓰지 않는다.`;
}


export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'no' }, { status: 401 });
  const date = '2026-10-21';
  const input = ['## 이미 일지에 적힌 것', '2026-10-21 | 점수 기록 없음 | 약 기록 없음 | 항히스타민 2알', '', '## 이미 기억하는 것', '없음', '', '## 2026-10-21 상담 (시간순)',
    '꼼이 (08:05): 어젯밤에 약을 깜빡해서 11시에 3알 먹었어. 오늘 아침에 손바닥이 엄청 가려웠어. 맥주도 한 캔 마셨고.',
    'Claude (08:05): Anthropic이 만든 AI Claude예요. 약을 늦게 드신 날 다음날 가려움이 올라오는지 일지에서 같이 볼게요. 약 양은 꼭 의사와 상의해 주세요.',
    '꼼이 (08:07): 의사 선생님이 지난주에 하루 2알까지는 괜찮다고 했어. 이번 주는 술 안 마셔 볼게.'].join('\n');
  const t0 = Date.now();
  const res = await new Anthropic().messages.parse({
    model: process.env.SKIN_CHAT_MODEL || 'claude-opus-5-5', max_tokens: 16000, system: rules(date),
    messages: [{ role: 'user', content: input }], output_config: { effort: 'medium', format: zodOutputFormat(Output) },
  });
  return NextResponse.json({ ms: Date.now() - t0, stop: res.stop_reason, usage: res.usage, out: res.parsed_output });
}
