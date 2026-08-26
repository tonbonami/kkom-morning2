// 한 번-탭 Bump 푸시 — narrator 톤으로 다양한 멘트를 랜덤 셔플 (사용자 요청).
// body { from, to, kind?: 'miss' | 'love' | 'hug' | 'kiss' | 'whitening' | 'night' }
// 방해 금지 시간(22-07) 적용 안 함 — 사용자가 명시적으로 누른 즉시 액션.

import { NextRequest, NextResponse, after } from 'next/server';
import webpush from 'web-push';
import { sendApns, keyForName } from '@/lib/apns';
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
  // 중계 톤 — 옆에서 지켜보던 제3자가 놀리듯 전한다. 직접 말보다 덜 부끄럽고 매번 다르다.
  // (사이담 세션에서 다듬은 문구 병합 + 꼼모닝 알짜 유지)
  miss: [
    { title: '🥹 {fromSubj} 또 보고싶대', body: '진짜 자주 찾는다 ㅋㅋ' },
    { title: '💌 또 {toName} 생각났대', body: '모른 척하기엔 티 난다' },
    { title: '👀 누가 또 찾는다', body: '네 이름부터 나오던데' },
    { title: '🌙 갑자기 보고싶어졌대', body: '이유는 굳이 안 묻자' },
    { title: '💗 {fromName}, 또 걸렸어', body: '{toName} 생각 중이래' },
    { title: '🙈 또 보고싶대 ㅋㅋ', body: '이 정도면 습관 맞지?' },
    { title: '📮 {toVoc}, 제보 들어왔어', body: '{fromSubj} 보고싶대' },
    { title: '☁️ 오늘도 네 생각이래', body: '꽤 오래 가는 중인가 봐' },
    { title: '💚 {fromName}가 {toName} 그리워하고 있어', body: '눈에 아른거리나봐' },
    { title: '💚 {toName} 보고싶다고 {fromName}가 보냈어', body: '받아줘 🥹' },
  ],
  love: [
    { title: '❤️ {fromSubj} 사랑한대', body: '이건 숨길 생각도 없네' },
    { title: '💘 또 사랑한대 ㅋㅋ', body: '네, 또 그 얘기입니다' },
    { title: '🫶 {toVoc}, 들었지?', body: '{fromSubj} 많이 사랑한대' },
    { title: '💌 사랑 고백 접수됨', body: '누구인진 말 안 할게' },
    { title: '😌 오늘도 결론은 사랑', body: '중간 과정은 생략한대' },
    { title: '💗 {fromName} 마음 또 샜다', body: '전부 {toName} 생각이래' },
    { title: '🙈 또 들켜버렸네', body: '사랑한다는 말 말이야' },
    { title: '🌷 별일 아닌 척하더니', body: '결국 사랑한대' },
    { title: '❤️ {fromName}한테 {toName}는 전부야', body: '이거 보고 답해줘 💕' },
    { title: '💕 {fromName}가 {toName} 세상에서 제일 좋대', body: '진짜 푹 빠졌네 ❤️' },
  ],
  hug: [
    { title: '🫂 {fromSubj} 안아달래', body: '오늘은 좀 꽉 안아줘' },
    { title: '🤍 포옹 요청 들어왔어', body: '누구 요청인진 알겠지' },
    { title: '👐 {toVoc}, 팔 좀 빌려줘', body: '{fromSubj} 안기고 싶대' },
    { title: '🥺 오늘은 안아줘야겠대', body: '이유는 묻지 말래' },
    { title: '📮 포옹 한 번 예약이래', body: '취소는 잘 안 받는대' },
    { title: '☁️ 품이 좀 필요하대', body: '누군지는 알 것 같은데' },
    { title: '🙈 {fromName} 요청사항', body: '{toVoc}, 한 번 안아달래' },
    { title: '🧸 가까이 있고 싶대', body: '일단 안아주면 될 듯' },
    { title: '🤗 안아달라고 {fromName} 콕 찔렀어', body: '오늘 힘들었나봐 🥹' },
    { title: '🤗 {fromName}가 {toName}한테 폭 안기고 싶대', body: '얼른 두 팔 벌려줘' },
  ],
  kiss: [
    { title: '😘 {fromSubj} 뽀뽀 원한대', body: '네, 전달만 합니다' },
    { title: '💋 뽀뽀 요청 접수', body: '요청자는 아주 당당함' },
    { title: '🙈 또 뽀뽀래 ㅋㅋ', body: '이 둘 진짜 어쩌면 좋아' },
    { title: '😚 {toVoc}, 소식 왔어', body: '{fromSubj} 뽀뽀하고 싶대' },
    { title: '💌 오늘의 요구사항', body: '뽀뽀 한 번이래' },
    { title: '😌 또 가까이 오고 싶대', body: '이유는 뽀뽀래' },
    { title: '💗 {fromName} 또 솔직해짐', body: '{toVoc}, 뽀뽀 원한대' },
    { title: '📮 뽀뽀 소식 도착', body: '택배는 아니래 ㅋㅋ' },
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

  // 누른 사람에게 필요한 건 '무슨 문구가 갔는지' 하나뿐 — 그건 지금 이 자리에서 확정된다.
  // 그래서 문구만 '즉시' 응답하고, 집계·APNs·웹푸시는 응답 뒤(after)로 미룬다 → 영수증이 곧바로 뜬다.
  // (사이담 세션 제안 ①: 이전엔 이 전부를 순서대로 await한 뒤에야 응답 → 영수증이 늦게 떴음)
  const templates = TEMPLATES[kind] || TEMPLATES.miss;
  const picked = pickRandom(templates);
  const title = fillTemplate(picked.title, from, to);
  const bodyText = fillTemplate(picked.body, from, to);

  after(async () => {
    // 집계 — '보냈다'는 사실이므로 푸시 결과와 무관하게 항상 increment.
    if (from === '우댕' || from === '꼼이') {
      try {
        const { incrementBump } = await import('@/lib/dailyStats');
        await incrementBump(from, kind);
      } catch (e) {
        console.warn('[bump] 집계 실패:', e);
      }
    }

    // APNs(네이티브)와 웹푸시는 서로 독립 채널 — 나란히 보낸다(순차 X).
    await Promise.all([
      // 네이티브 APNs — 웹 구독 없어도 시도. category: 알림 꾹 눌러 답장 / sender: 상대 아바타+이름.
      sendApns(keyForName(to), title, bodyText, { category: 'KKOM_MSG', sender: from })
        .catch((e) => { console.warn('[bump] APNs 실패:', e); return false; }),
      // 웹푸시 — 구독 있을 때만.
      (async () => {
        try {
          const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
          if (!subSnap.exists()) return; // 웹 구독 없음(네이티브만 있을 수 있음)
          const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };
          const payload = JSON.stringify({ title, body: bodyText, url: '/' });
          try {
            await webpush.sendNotification(s as any, payload);
          } catch (e: any) {
            const status = e?.statusCode;
            if (status === 404 || status === 410) { try { await deleteDoc(subSnap.ref); } catch {} }
            console.warn('[bump] 웹푸시 실패:', status || String(e?.body || e));
          }
        } catch (e) {
          console.warn('[bump] 웹푸시 조회 실패:', e);
        }
      })(),
    ]);
  });

  return NextResponse.json({ ok: true, sent: { title, body: bodyText } });
}
