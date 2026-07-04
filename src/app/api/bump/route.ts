// 한 번-탭 Bump 푸시 — narrator 톤으로 다양한 멘트를 랜덤 셔플 (사용자 요청).
// body { from, to, kind?: 'miss' | 'love' | 'hug' | 'kiss' | 'whitening' | 'night' }
// 방해 금지 시간(22-07) 적용 안 함 — 사용자가 명시적으로 누른 즉시 액션.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

// 받침 처리 — 우댕(받침) → '우댕이가/우댕이', 꼼이(이미 '이') → '꼼이가/꼼이'
function nameWithI(name: string): string {
  if (name === '우댕') return '우댕이';
  if (name === '꼼이') return '꼼이';
  return name;
}
function withSubjectParticle(name: string): string {
  if (!name) return name;
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return name + '이가';
  const hasFinal = (last - 0xAC00) % 28 !== 0;
  return name + (hasFinal ? '이가' : '가');
}
// 호격 — 우댕→우댕아, 꼼이→꼼이야
function vocative(name: string): string {
  if (!name) return name;
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return name + '아';
  const hasFinal = (last - 0xAC00) % 28 !== 0;
  return name + (hasFinal ? '아' : '야');
}

function fillTemplate(template: string, from: string, to: string): string {
  return template
    .replace(/\{fromName\}/g, nameWithI(from))
    .replace(/\{toName\}/g, nameWithI(to))
    .replace(/\{fromSubj\}/g, withSubjectParticle(from))
    .replace(/\{toSubj\}/g, withSubjectParticle(to))
    .replace(/\{toVoc\}/g, vocative(to));
}

type BumpKind = 'miss' | 'love' | 'hug' | 'kiss' | 'whitening' | 'night';

// 각 종류별 narrator 톤 멘트 변주. 매번 랜덤 셔플 → 매번 새로운 푸시 멘트.
const TEMPLATES: Record<BumpKind, Array<{ title: string; body: string }>> = {
  miss: [
    { title: '💚 {fromName}가 또 {toName} 보고싶대 ㅋㅋ', body: '하루에 몇 번이야' },
    { title: '💚 {fromName}는 {toName} 없으면 안 되나봐', body: '꼼모닝에서 콕 찔러줘 ✨' },
    { title: '🥹 또 보고싶대...', body: '{fromSubj} 진짜 {toName} 좋아하나봐' },
    { title: '💚 {fromName}가 {toName}만 생각해', body: '머릿속이 {toName}로 가득해 💕' },
    { title: '💚 보고싶다고 {fromName}가 콕 찔렀어', body: '얼레리꼴레리 ㅋㅋ' },
    { title: '💚 {fromName}는 {toName} 보는 게 인생 낙이래', body: '얼른 답해줘 ✨' },
    { title: '💚 {fromName}가 {toName} 그리워하고 있어', body: '눈에 아른거리나봐' },
    { title: '💚 {toName} 보고싶다고 {fromName}가 보냈어', body: '받아줘 🥹' },
  ],
  love: [
    { title: '❤️ {fromName}가 {toName} 사랑한대', body: '오늘도 너 덕분에 든든해 💕' },
    { title: '❤️ {fromName}는 {toName} 너무 좋아해', body: '사랑 폭발 ❤️‍🔥' },
    { title: '❤️ 또 사랑해래 ㅋㅋ', body: '{fromName}는 {toName} 좋아 죽겠나봐' },
    { title: '❤️ {fromName}가 사랑 가득 보냈어', body: '받아 {toVoc} 💕' },
    { title: '❤️ {fromName}는 {toName} 없으면 못 살아', body: '얼레리꼴레리 ㅋㅋ' },
    { title: '❤️ 사랑한다고 {fromName} 또 외쳤어', body: '심장 부서질 듯 사랑한대' },
    { title: '❤️ {fromName}한테 {toName}는 전부야', body: '이거 보고 답해줘 💕' },
    { title: '💕 {fromName}가 {toName} 세상에서 제일 좋대', body: '진짜 푹 빠졌네 ❤️' },
  ],
  hug: [
    { title: '🤗 {fromName}는 {toName} 품이 좋나봐', body: '안아달라잖아... 얼레리꼴레리 ㅋㅋ' },
    { title: '🤗 {fromName}가 {toName} 품 그리워해', body: '꼭 안아줘 💗' },
    { title: '🤗 {fromName}가 안기고 싶대', body: '{toName} 품이 인생이래' },
    { title: '🤗 안아줘 안아줘 — {fromName}가 졸라', body: '폭 안겨서 떨어지기 싫대' },
    { title: '🤗 {fromName}는 {toName} 품에 살고 싶대', body: '꼭 안아주자 💞' },
    { title: '🤗 안아달라고 {fromName} 콕 찔렀어', body: '오늘 힘들었나봐 🥹' },
    { title: '🤗 {fromName}가 {toName}한테 폭 안기고 싶대', body: '얼른 두 팔 벌려줘' },
  ],
  kiss: [
    { title: '💋 {fromName}가 {toName}랑 뽀뽀하고 싶대', body: '쪽 💋' },
    { title: '💋 {fromName}는 {toName}랑 뽀뽀하는 거 엄청 좋아하네', body: '얼레리꼴레리 ㅋㅋ' },
    { title: '😘 {fromName}가 입술 모았어', body: '쪽! 🩷' },
    { title: '😘 또 뽀뽀 보냈어 ㅋㅋ', body: '{fromName}는 진짜 자주 보내네' },
    { title: '💋 {toName}한테 뽀뽀 도착!', body: '{fromName}가 보냈어 🥰' },
    { title: '😘 {fromName}는 {toName} 입술이 인생이래', body: '받아 🩷' },
    { title: '💋 쪽! 쪽! 쪽!', body: '{fromName}한테서 뽀뽀 폭격이야' },
    { title: '😘 {fromName}가 입술 모은 채 기다려', body: '얼른 뽀뽀해줘 💋' },
  ],
  whitening: [
    { title: '😬 {fromName}가 화이트닝 보냈어!', body: '치아 환하게! 오늘도 화이팅 ✨' },
    { title: '✨ {fromName} 응원 도착', body: '{toVoc} 환하게 빛나자!' },
    { title: '😬 화이트닝! — {fromName}가 외쳤어', body: '이 반짝반짝하게 빛나는 하루 💫' },
    { title: '✨ 오늘도 환하게! — {fromName}', body: '{toName} 미백 응원해, 화이팅 💪' },
    { title: '😬 {fromName}가 또 화이트닝 외쳤어', body: '치아 환하게 빛난다 ✨' },
    { title: '💪 화이트닝!', body: '{fromName}가 {toName} 위해 외쳐 ✨' },
  ],
  night: [
    { title: '🌙 {fromName}가 {toName}한테 잘 자래', body: '좋은 꿈 꿔 ✨' },
    { title: '🌙 잘 자 {toVoc}', body: '{fromName}가 자장가 보냈어, 꿈에서 만나' },
    { title: '🌙 {fromName} 굿나잇 도착', body: '편안한 밤 💤' },
    { title: '🌙 오늘 하루 수고했어', body: '{fromName}가 {toName}한테 잘 자래 ✨' },
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  let body: { from?: string; to?: string; kind?: BumpKind };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { from, to, kind = 'miss' } = body;
  if (!to || !from) {
    return NextResponse.json({ error: 'to/from required' }, { status: 400 });
  }

  // Claude 참고(코드리뷰 #3): bump 기록을 푸시 성공 여부와 분리.
  // 이전엔 상대 구독 없으면 skip으로 조기 return → 애정 표현이 dailyStats에 안 남고 증발했음.
  // 기록은 '보냈다'는 사실이므로 푸시 결과와 무관하게 항상 increment.
  let counted = false;
  if (from === '우댕' || from === '꼼이') {
    try {
      const { incrementBump } = await import('@/lib/dailyStats');
      await incrementBump(from, kind);
      counted = true;
    } catch (e) {
      console.warn('bump 기록 실패:', e);
    }
  }

  const templates = TEMPLATES[kind] || TEMPLATES.miss;
  const picked = pickRandom(templates);

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) {
    // 기록은 됐고 푸시만 못 감 — 클라이언트가 구분할 수 있게 pushSkipped 표시
    return NextResponse.json({ ok: true, counted, pushSkipped: 'no subscription for ' + to });
  }
  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

  const payload = JSON.stringify({
    title: fillTemplate(picked.title, from, to),
    body: fillTemplate(picked.body, from, to),
    url: '/',
  });

  try {
    await webpush.sendNotification(s as any, payload);
    return NextResponse.json({ ok: true, counted });
  } catch (e: any) {
    const status = e?.statusCode;
    if (status === 404 || status === 410) {
      try { await deleteDoc(subSnap.ref); } catch {}
    }
    // 기록은 됐으므로 ok:true 유지, 푸시 실패만 별도 표시
    return NextResponse.json({ ok: true, counted, pushError: status || String(e?.body || e) });
  }
}
