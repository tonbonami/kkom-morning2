// 큰 이모티콘 팩 — 꼼톡 서랍과 편지(큰 이모티콘)가 같이 쓴다. 2026-11-07 ChatPanel 에서 옮김(우댕 「이모티콘도 큰거 다양하게」).
//   ⚠️ 그림 주소(파일 이름)는 바꾸지 말 것 — 꼼톡 옛 메시지는 주소를, 편지는 주소에서 만든 id(src/lib/emoticons.ts)를 저장한다.
//   새 그림은 여기 목록에 한 줄 넣으면 꼼톡 서랍과 편지 고르는 창에 같이 뜬다.
// 꼼이(별) 탭 — 움직이는 이모티콘 모음(사이담 제작, 투명 배경 애니 webp). 서랍의 첫 탭.
// ⚠️ 서랍(피커)엔 정지컷(-still.png)만 띄우고, 보낼 때/채팅에선 webp가 재생된다.
//    6개 움짤을 서랍에서 동시에 디코딩하면 저사양 기기가 버벅여서(사이담 경고).
const ANIM_RAW: { word: string; image: string; still: string }[] = [
  { word: '안녕!',     image: '/emo/sai-anim/hi.webp',      still: '/emo/sai-anim/hi-still.png' },
  { word: '좋은 아침',  image: '/emo/sai-anim/sunrise.webp', still: '/emo/sai-anim/sunrise-still.png' },
  { word: '두근두근',   image: '/emo/sai-anim/doki.webp',    still: '/emo/sai-anim/doki-still.png' },
  { word: '사랑해',     image: '/emo/sai-anim/love.webp',    still: '/emo/sai-anim/love-still.png' },
  { word: '보고싶어',   image: '/emo/sai-anim/missyou.webp', still: '/emo/sai-anim/missyou-still.png' },
  { word: '고마워',     image: '/emo/sai-anim/thanks.webp',  still: '/emo/sai-anim/thanks-still.png' },
  { word: '삐짐',       image: '/emo/sai-anim/sulk.webp',    still: '/emo/sai-anim/sulk-still.png' },
  { word: '흥!',        image: '/emo/sai-anim/wave.webp',    still: '/emo/sai-anim/wave-still.png' },
  { word: '미안해',     image: '/emo/sai-anim/sorry.webp',   still: '/emo/sai-anim/sorry-still.png' },
  { word: '잘자',       image: '/emo/sai-anim/night.webp',   still: '/emo/sai-anim/night-still.png' },
  { word: '씻고 올게',  image: '/emo/sai-anim/bath.webp',    still: '/emo/sai-anim/bath-still.png' },
  { word: '아파',       image: '/emo/sai-anim/sick.webp',    still: '/emo/sai-anim/sick-still.png' },
  { word: '좋아!',      image: '/emo/sai-anim/yay.webp',     still: '/emo/sai-anim/yay-still.png' },
  { word: '으악',       image: '/emo/sai-anim/yell.webp',    still: '/emo/sai-anim/yell-still.png' },
  { word: '축하해!',    image: '/emo/sai-anim/party.webp',   still: '/emo/sai-anim/party-still.png' },
  { word: '선물',       image: '/emo/sai-anim/gift.webp',    still: '/emo/sai-anim/gift-still.png' },
  { word: '부끄',       image: '/emo/sai-anim/shy.webp',     still: '/emo/sai-anim/shy-still.png' },
  { word: '꼬옥',       image: '/emo/sai-anim/hug.webp',     still: '/emo/sai-anim/hug-still.png' },   // ⚠️ 새 커플 캐릭터(남↔여) — 기존 꼼이 한 마리와 다름
  { word: '빼꼼',       image: '/emo/sai-anim/peek.webp',    still: '/emo/sai-anim/peek-still.png' },  // ⚠️ 장면 스티커(배경 그려진 둥근 카드, 투명 컷아웃 아님)
  { word: '일어나기 싫어', image: '/emo/sai-anim/bed.webp',   still: '/emo/sai-anim/bed-still.png' },   // 장면 카드 — 이불 속
  { word: '비온다',     image: '/emo/sai-anim/rain.webp',    still: '/emo/sai-anim/rain-still.png' },  // 장면 카드 — 창밖 비
  // 꼼모닝이 Kling으로 만든 것(사이담 제작 아님) — 원본·키프레임은 art/kling/puff, art/kling/sleepy
  { word: '힘내!',      image: '/emo/sai-anim/himnae.webp',  still: '/emo/sai-anim/himnae-still.png' }, // 털 펑
  { word: '졸려',       image: '/emo/sai-anim/doze.webp',    still: '/emo/sai-anim/doze-still.png' },   // 콧방울 펑(반복 고리)
  { word: '뽀뽀',       image: '/emo/sai-anim/kiss.webp',    still: '/emo/sai-anim/kiss-still.png' },   // 귀로 하트(반복 고리) — art/kling/kiss
  { word: '퇴근!',      image: '/emo/sai-anim/offwork.webp', still: '/emo/sai-anim/offwork-still.png' }, // 6시 땡 → 귀 날개로 날아 퇴근(꼼이 퇴근 23번, 거의 18시) — art/kling/offwork
  { word: '의기냥냥!',  image: '/emo/sai-anim/kkom-nyang.webp', still: '/emo/sai-anim/kkom-nyang-still.png' }, // 둘만의 다짐 구호 — 냥! 냥! 펀치 → 뿌듯한데 귀가 코끝에 찰싹(art/nyang, Kling 19·20, 우댕 「넣어」 2026-10-30). 꿀됑 판은 KKUL_ANIM
];
// ⚠️ sai-anim webp/still을 사이담이 같은 이름으로 재인코딩(알파 복구·재작업)할 때마다 EMO_V를 +1 → 기기 캐시 무효화(전역).
//   2026-09-11 알파 복구(라이트에서 눈 회색) 14종 반영으로 3. (사이담 EMO_V와 별개, 값만 맞춰 올리면 됨)
//   2026-09-13 크기 74% 통일(캐릭터키 기준) 15종 + still 재생성 → 4. 폭죽 59%→74% 등. 으악은 우리는 팩에 남김(사이담은 리타이어).
export const EMO_V = 4;
export const ANIM_STICKERS = ANIM_RAW.map((s) => ({ ...s, image: `${s.image}?v=${EMO_V}`, still: `${s.still}?v=${EMO_V}` }));

// Dang's 탭 — 단독 스티커(탭해서 크게 전송). 추가하려면 여기 { word, image } 한 줄.
export const DANG_STICKERS: { word: string; image: string }[] = [
  { word: '귀엽꼬미', image: '/pochacco_dang/cutekkomi.png' },
  { word: '앙 귀여워', image: '/pochacco_dang/angcute.png' },
  { word: '치카치카', image: '/pochacco_dang/dangchicca.png' },
  { word: '푸데데', image: '/pochacco_dang/dangpudede.png' },
];
// kkom's 탭 — 꼼이(여자 포차코) 스티커
export const KKOM_STICKERS: { word: string; image: string }[] = [
  { word: '달려가는 중', image: '/pochacco_kkom/kkomrun.png' },
  { word: '꾸미는 중', image: '/pochacco_kkom/kkommakeup.png' },
  { word: '치카치카', image: '/pochacco_kkom/kkomchicca.png' },
  { word: '얍', image: '/pochacco_kkom/kkomiyap.png' },
  { word: '푸데데', image: '/pochacco_kkom/kkomipudede.png' },
  { word: '인싸강아지', image: '/pochacco_kkom/pochaccofly.png' },
];

// 꿀됑 탭(우댕 지정 이름) — 우댕 캐릭터 '꿀댕이'(꿀벌 조끼 아기돼지) 16종. 우댕이 꼼이에게 보낸 말 2,049개를 세어 고름(2026-10-15).
//   글자는 그림 안에(주아체 배지, 사이담 규칙). 원본·초록판·만든 스크립트 메모는 art/kkuldaeng/set16.
export const KKUL_STICKERS: { word: string; image: string }[] = [
  { word: '꼼슌아',   image: '/emo/kkuldaeng/01-ggomsyun.webp' },
  { word: '사랑해',   image: '/emo/kkuldaeng/02-saranghae.webp' },
  { word: '보고싶어', image: '/emo/kkuldaeng/03-bogosipeo.webp' },
  { word: '앙귀여워', image: '/emo/kkuldaeng/04-anggwiyeowo.webp' },
  { word: 'ㅋㅋㅋ',   image: '/emo/kkuldaeng/05-kkk.webp' },
  { word: '배고파',   image: '/emo/kkuldaeng/06-baegopa.webp' },
  { word: '가는중',   image: '/emo/kkuldaeng/07-ganeunjung.webp' },
  { word: '도착!',    image: '/emo/kkuldaeng/08-dochak.webp' },
  { word: '으악',     image: '/emo/kkuldaeng/09-euak.webp' },
  { word: '꼬옥',     image: '/emo/kkuldaeng/10-kkoook.webp' },
  { word: '고마워',   image: '/emo/kkuldaeng/11-gomawo.webp' },
  { word: '진짜아?',  image: '/emo/kkuldaeng/12-jinjja.webp' },
  { word: '화이트닝', image: '/emo/kkuldaeng/13-whitening.webp' },
  { word: '응응',     image: '/emo/kkuldaeng/14-eungeung.webp' },
  { word: '괜찮아?',  image: '/emo/kkuldaeng/15-gwaenchanha.webp' },
  { word: '좋은아침', image: '/emo/kkuldaeng/16-joeunachim.webp' },
  { word: '야호!',    image: '/emo/kkuldaeng/17-yaho.webp' },   // 우댕 문장 끝 (야호) 340번 — 글 속은 TEXT_STICKER_BY_SENDER(우댕 OK 2026-10-19)
  { word: '푸데데',   image: '/emo/kkuldaeng/18-pudede.webp' }, // 둘만의 말 「푸데데」=꿀잠 — 꼼이 닮은 말티푸 인형 안고 (우댕 B안 OK 2026-10-20)
  { word: '뽀뽀',     image: '/emo/kkuldaeng/19-ppoppo.webp' },
  { word: '미안해',   image: '/emo/kkuldaeng/20-mianhae.webp' }, // 꿀단지 내밀며 울먹 — Aside 검수 "꿀됑에 미안해 없음" (우댕 A안 OK 2026-10-21) // 꼼이가 꿀됑 볼에 기습 뽀뽀, 꿀됑 더듬이가 하트로 (우댕 "1,2 둘다" 2026-10-20)
  { word: '약속!',    image: '/emo/kkuldaeng/21-yaksok.webp' },  // 하트 카드에 코 도장(콧구멍 두 개), 코끝에 잉크 — 글 속 (약속)과 같은 그림(art/yaksok)
];
// 꿀됑 움짤 탭(우댕 지시: 따로) — sai-anim 경로에 둬서 서랍은 정지컷(-still.png), 채팅은 흔들기 없이 재생(기존 움짤 규칙 그대로).
//   만든 법·원본은 art/kkuldaeng/{euak,…} (Codex 키프레임 → Kling → 편집 → make_anim.py).
export const KKUL_ANIM: { word: string; image: string }[] = [
  { word: '으악 펄쩍', image: '/emo/sai-anim/kkul-euak.webp' },
  { word: 'ㅋㅋㅋ 발라당', image: '/emo/sai-anim/kkul-kkk.webp' },   // art/kkuldaeng/kkk
  { word: '꽃 줄게', image: '/emo/sai-anim/kkul-flower.webp' },   // art/kkuldaeng/flower
  { word: '안아줘 꼬리하트', image: '/emo/sai-anim/kkul-hug.webp' },   // art/kkuldaeng/hug
  { word: '일어나 붕붕', image: '/emo/sai-anim/kkul-wake.webp' },   // art/kkuldaeng/wake — 꼼이랑 둘이 나오는 첫 움짤(우댕 OK 2026-10-18)
  // 떡 말놀이(우댕 OK 2026-10-19) — 꼼이 「찰떡!」→ 우댕 「쑥떡!」→ 꼼이 「콩떡!」→ 우댕 「개떡!」. 짝 답장이 다음 떡을 먼저 띄운다(TTEOK_NEXT).
  //   art/kkuldaeng/tteok — 낱장은 앞뒤 반복, 합친 판은 장면마다 배지가 바뀐다(make_combo.py).
  { word: '찰떡!', image: '/emo/sai-anim/kkul-tteok-chal.webp' },
  { word: '쑥떡!', image: '/emo/sai-anim/kkul-tteok-ssuk.webp' },
  { word: '콩떡!', image: '/emo/sai-anim/kkul-tteok-kong.webp' },
  { word: '개떡!', image: '/emo/sai-anim/kkul-tteok-gae.webp' },
  { word: '찰떡 쑥떡 콩떡 개떡', image: '/emo/sai-anim/kkul-tteok-all.webp' },
  // 떡 말놀이 마무리 — 개떡 다음에 둘이 같이 「멍!」 → 멍때림 「멍...」 (art/kkuldaeng/meong, Kling 18 A·B 중 가운데 뺀 판, 우댕 「②로 하자」 2026-10-27)
  { word: '멍!', image: '/emo/sai-anim/kkul-meong.webp' },
  { word: '기습 뽀뽀', image: '/emo/sai-anim/kkul-kiss.webp' },   // art/kkuldaeng/kiss — 꼼이가 볼에 쪽 → 꿀됑 더듬이 하트·빨개져 붕 뜸 (Kling 17, 우댕 "그냥 클링으로" 2026-10-20)
  // 둘만의 다짐 구호 「냥냥! 의기냥냥!」 — 고양이 발짓 → 고개 번쩍 외침 → 뿌듯한데 더듬이 방울 둘이 콩 (art/nyang, Kling 19, 우댕 「꿀됑 먼저 넣어」 2026-10-30)
  { word: '의기냥냥!', image: '/emo/sai-anim/kkul-nyang.webp' },
  // 꼼이 「좋은 아침」(수평선 위로 꼼이 얼굴이 해처럼)의 짝 — 더듬이 방울이 먼저 빼꼼 → 멍하게 떠오름 → 해 뜨며 쏙 숨었다 뿌듯 → 다시 밤으로(art/kkuldaeng/morning, Kling 21, 우댕 「넣어」 2026-11-02)
  { word: '좋은 아침', image: '/emo/sai-anim/kkul-morning.webp' },
];
// 우리 탭 — 꿀됑+꼼이가 같이 나오는 커플 16종(정지, 글씨 배지). GPT 회의(후보 20 → 16, 순서 = 자주 쓸 것 앞) + 우댕 OK(2026-10-27).
//   원본·회의 원문·지시문·만든 스크립트는 art/couple16 (make_couple.py: 투명 그림 → 배지 webp 320).
export const URI_STICKERS: { word: string; image: string }[] = [
  { word: '꼼모닝',     image: '/emo/uri/01-morning.webp' },   // 한 이불에서 빼꼼, 더듬이가 아침 해
  { word: '잘자',       image: '/emo/uri/02-night.webp' },     // 등 맞대고 동그랗게, 날개 이불
  { word: '사랑해',     image: '/emo/uri/03-love.webp' },      // 하트 풍선 줄이 꿀됑 꼬리에
  { word: '냠냠냠',     image: '/emo/uri/04-mukbang.webp' },   // 한 그릇 먹방, 코에 면 한 가닥
  { word: '찰칵',       image: '/emo/uri/05-selfie.webp' },    // 셀카, 더듬이 끝이 하트
  { word: '조심히 와',  image: '/emo/uri/06-takecare.webp' },  // 목도리 배웅, 끝이 더듬이 방울 귀마개
  { word: '왔어!',      image: '/emo/uri/07-arrived.webp' },   // 급브레이크 데굴
  { word: '괜찮아',     image: '/emo/uri/08-itsok.webp' },     // 볼 기대기, 더듬이도 같이 축
  { word: '수고했어',   image: '/emo/uri/09-goodjob.webp' },   // 뻗은 꿀됑에게 꽃목걸이
  { word: '삐짐',       image: '/emo/uri/10-sulk.webp' },      // 등 돌렸는데 꼬리는 몰래 닿음
  { word: '화해',       image: '/emo/uri/11-makeup.webp' },    // 사과(=사과) 물고 꽃이랑 콩
  { word: '축하해',     image: '/emo/uri/12-congrats.webp' },  // 촛불은 멀쩡, 귀·더듬이만 휙
  { word: '푸데데',     image: '/emo/uri/13-nap.webp' },       // 꿀됑 배 베고 낮잠, 콧방울
  { word: '화이트닝',   image: '/emo/uri/14-whitening.webp' }, // 둘만의 구호 — 반짝 이빨 광선 교차
  { word: '먼지 저리가', image: '/emo/uri/15-dust.webp' },     // 날개 바람에 울상 먼지들 도망
  { word: '데이트',     image: '/emo/uri/16-date.webp' },      // 셰이크 하나에 빨대 둘
];

// 사이 탭 — 사이담 말티푸 '사이' 팩(하루에 제일 많이 하는 말). 글자가 그림 안에 들어있음.
// 순서는 사이담 EMOTICONS(setId=SAI) 정의 순서 그대로(우댕 지시 "순서도 그대로").
export const SAI_STICKERS: { word: string; image: string }[] = [
  { word: '맛점', image: '/emo/sai/lunch.webp' },
  { word: 'ㅋㅋㅋ', image: '/emo/sai/kkk.webp' },
  { word: '뭐해?', image: '/emo/sai/what.webp' },
  { word: '굿모닝', image: '/emo/sai/goodmorning.webp' },
  { word: '출근중', image: '/emo/sai/towork.webp' },
  { word: '배고파', image: '/emo/sai/hungry.webp' },
  { word: '졸려', image: '/emo/sai/sleepy.webp' },
  { word: '도착!', image: '/emo/sai/arrival.webp' },
  { word: '미안', image: '/emo/sai/apple.webp' },
  { word: '배불러', image: '/emo/sai/full.webp?v=2' },
  { word: '심심해', image: '/emo/sai/simsim.webp' },
  { word: '헐', image: '/emo/sai/hul.webp' },
  { word: 'ㄴㄴ', image: '/emo/sai/nono.webp' },
  { word: '가는중', image: '/emo/sai/ontheway.webp' },
  { word: '굿밤', image: '/emo/sai/goodnight.webp' },
  { word: '바빠', image: '/emo/sai/busy.webp' },
  { word: '헤헤', image: '/emo/sai/hehe.webp' },   // 꼼이 말버릇 헤헤(73번, 전부 꼼이) — A안: 두 앞발로 입 가리고 눈웃음(우댕 OK 2026-10-19)
  { word: '약속!', image: '/emo/sai/yaksok.webp' }, // 하트 카드에 발바닥 도장 — 글 속 (약속)과 같은 그림(art/yaksok)
  { word: '꼼돌아', image: '/emo/sai/kkomdol.webp' }, // 꼼이가 우댕을 부름 — 꿀됑 「꼼슌아」를 좌우로 뒤집은 짝(art/kkom-call A안, 우댕 OK 2026-10-30)
];
