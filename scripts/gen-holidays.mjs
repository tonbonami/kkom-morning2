import { writeFileSync } from 'fs';
const LUNAR = {
  2024:{seol:'2024-02-10', chuseok:'2024-09-17', buddha:'2024-05-15'},
  2025:{seol:'2025-01-29', chuseok:'2025-10-06', buddha:'2025-05-05'},
  2026:{seol:'2026-02-17', chuseok:'2026-09-25', buddha:'2026-05-24'},
  2027:{seol:'2027-02-07', chuseok:'2027-09-15', buddha:'2027-05-13'},
  2028:{seol:'2028-01-27', chuseok:'2028-10-03', buddha:'2028-05-02'},
};
const p=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d));};
const f=dt=>dt.toISOString().slice(0,10);
const add=(s,n)=>{const dt=p(s);dt.setUTCDate(dt.getUTCDate()+n);return f(dt);};
const dow=s=>p(s).getUTCDay();
const SUB_OK=new Set(['삼일절','어린이날','부처님오신날','광복절','개천절','한글날','성탄절','설날','추석']);
function gen(year){
  const L=LUNAR[year], base=[];
  const push=(d,n)=>base.push({date:d,name:n});
  push(`${year}-01-01`,'신정'); push(`${year}-03-01`,'삼일절'); push(`${year}-05-05`,'어린이날');
  push(`${year}-06-06`,'현충일'); push(`${year}-08-15`,'광복절'); push(`${year}-10-03`,'개천절');
  push(`${year}-10-09`,'한글날'); push(`${year}-12-25`,'성탄절');
  if(L){ for(const o of[-1,0,1])push(add(L.seol,o),'설날'); for(const o of[-1,0,1])push(add(L.chuseok,o),'추석'); push(L.buddha,'부처님오신날'); }
  const byDate={}; for(const {date,name} of base){(byDate[date]=byDate[date]||[]).push(name);}
  const hset=new Set(Object.keys(byDate)), subs={};
  for(const date of Object.keys(byDate).sort()){
    const names=byDate[date];
    if(names.some(n=>SUB_OK.has(n)) && (dow(date)===0||dow(date)===6||names.length>=2)){
      let nd=add(date,1); while(dow(nd)===0||dow(nd)===6||hset.has(nd)||subs[nd]) nd=add(nd,1);
      subs[nd]='대체공휴일'; hset.add(nd);
    }
  }
  const out={};
  for(const date of Object.keys(byDate)) out[date]=[...new Set(byDate[date])].join('·');
  for(const date of Object.keys(subs)) out[date]='대체공휴일';
  return out;
}
const all={};
for(const y of Object.keys(LUNAR).map(Number)) Object.assign(all,gen(y));
const sorted=Object.keys(all).sort();
const lines=sorted.map(d=>`  '${d}': '${all[d]}',`).join('\n');
const ts=`// 한국 공휴일 (자동 표시용). 음력 본일=공표값, 연휴 3일+대체공휴일=규칙 계산(scripts/gen-holidays).
// 대체공휴일 대상: 삼일절·어린이날·부처님오신날·광복절·개천절·한글날·성탄절·설날/추석연휴 (신정·현충일 제외).
// 연도 추가하려면 생성 스크립트의 LUNAR에 설날/추석/부처님 양력만 넣고 재생성.
export const KR_HOLIDAYS: Record<string, string> = {
${lines}
};

// 'YYYY-MM-DD' → 공휴일명 또는 null
export function holidayName(ymd: string): string | null {
  return KR_HOLIDAYS[ymd] ?? null;
}
`;
writeFileSync('src/lib/holidays.ts', ts);
console.log('src/lib/holidays.ts 작성 완료 —', sorted.length, '일 ('+sorted[0]+' ~ '+sorted[sorted.length-1]+')');
