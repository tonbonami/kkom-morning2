'use client';
// 꼼이 피부 일지 — 기록 화면. 겉모습은 components/skin/*(제미나이 시안, 값 그대로), 여기선 데이터만 연결.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinPinGate from '@/components/skin/SkinPinGate';
import SkinJournalView from '@/components/skin/SkinJournalView';
import SkinCalendar, { type CalDay } from '@/components/skin/SkinCalendar';
import SkinDayReport from '@/components/skin/SkinDayReport';
import SkinDayForm from '@/components/skin/SkinDayForm';
import SkinPhotoStrip from '@/components/skin/SkinPhotoStrip';
import SkinScreen from '@/components/skin/SkinScreen';
import SkinPartnerAlert from '@/components/skin/SkinPartnerAlert';
import type { SkinDraft } from '@/components/skin/skinUi';
import type { SkinLog } from '@/lib/skinTypes';
import {
  READ_ONLY_MSG, addDays, addMonths, appUserName, monthDays, monthOf, toReportDay, deleteSkinPhoto, draftFrom, fetchSkinLogs, fetchSkinPhotos, kstToday, medOfDay,
  fetchSkinSettings, prefillCycle, saveSkinLog, saveSkinSettings, savedAtText, skinLogin, skinSession, uploadSkinPhoto, type SkinPhotoView, type SkinRole,
} from '@/lib/skinClient';
import { isPractice } from '@/lib/practice';

// 저장 전 기록을 폰에도 적어 둔다(앱이 꺼지거나 저장이 실패해도 다시 열면 되살림 — 우댕: 기록이 절대 날아가면 안 됨)
const draftKey = (date: string) => `${isPractice() ? 'kk-skin-draft-demo' : 'kk-skin-draft'}:${date}`;
function readLocalDraft(date: string, serverUpdatedAt?: string): SkinDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(date));
    if (!raw) return null;
    const { draft, at } = JSON.parse(raw) as { draft: SkinDraft; at: number };
    if (serverUpdatedAt && Date.parse(serverUpdatedAt) >= at) { localStorage.removeItem(draftKey(date)); return null; }
    return draft?.date === date ? draft : null;
  } catch { return null; }
}
const RESTORED_MSG = '저장 안 된 기록을 되살렸어요 — 저장을 눌러 주세요';

type Gate = 'loading' | 'locked' | 'open';

export default function SkinJournalPage() {
  const router = useRouter();
  const today = useMemo(() => kstToday(), []);
  const [gate, setGate] = useState<Gate>('loading');
  const [role, setRole] = useState<SkinRole | null>(null);
  const readOnly = role !== 'kkomi';
  const [pinStatus, setPinStatus] = useState<'idle' | 'checking' | 'bad' | 'locked'>('idle');
  const [logs, setLogs] = useState<Record<string, SkinLog>>({});
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState<SkinDraft>(() => draftFrom(today));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const loadedRef = useRef(false);
  // 달력(주 ↔ 달). 달마다 한 번씩만 받아 logs에 합친다
  const [calMode, setCalMode] = useState<'week' | 'month'>('week');
  const [calYm, setCalYm] = useState(() => monthOf(today));
  const [monthLoading, setMonthLoading] = useState(false);
  const loadedMonths = useRef(new Set<string>());
  const [photos, setPhotos] = useState<SkinPhotoView[]>([]);
  const [partnerAlert, setPartnerAlert] = useState<boolean | null>(null);
  const [alertBusy, setAlertBusy] = useState(false);
  useEffect(() => {
    if (gate !== 'open') return;
    fetchSkinSettings().then((s) => setPartnerAlert(s ? s.partnerAlert : null)).catch(() => {});
  }, [gate]);
  const toggleAlert = async (next: boolean) => {
    setAlertBusy(true);
    const ok = await saveSkinSettings(next).catch(() => false);
    if (ok) setPartnerAlert(next); else window.alert('바꾸지 못했어요. 다시 해 주세요.');
    setAlertBusy(false);
  };
  const [uploading, setUploading] = useState(false);

  // 고른 날의 사진(15분짜리 주소라 날을 바꿀 때마다 새로 받는다)
  useEffect(() => {
    if (gate !== 'open') return;
    let alive = true;
    setPhotos([]);
    fetchSkinPhotos(selected).then((p) => { if (alive) setPhotos(p); }).catch(() => {});
    return () => { alive = false; };
  }, [gate, selected]);

  const onAddPhotos = async (files: FileList) => {
    if (readOnly) { showReadOnly(); return; }
    const list = Array.from(files);
    setUploading(true);
    try {
      for (const f of list) {
        const p = await uploadSkinPhoto(selected, f);
        setPhotos((cur) => [...cur, p]);
      }
    } catch {
      window.alert('사진을 올리지 못했어요. 다시 해 주세요.');
    } finally {
      setUploading(false);
    }
  };

  const onDeletePhoto = async (id: string) => {
    if (readOnly) { showReadOnly(); return; }
    setPhotos((cur) => cur.filter((p) => p.id !== id));
    await deleteSkinPhoto(selected, id).catch(() => {});
  };

  // 고른 날 폼 채우기 — 폰에 저장 안 된 기록이 서버 것보다 새로우면 그걸 되살린다
  const openDay = (date: string, map: Record<string, SkinLog>) => {
    const local = readLocalDraft(date, map[date]?.updatedAt);
    if (local) { setDraft(local); setDirty(true); setSavedAt(RESTORED_MSG); return; }
    setDraft(prefillCycle(draftFrom(date, map[date]), map[date], map[addDays(date, -1)]));
    setSavedAt(map[date] ? savedAtText(map[date].updatedAt) : null);
    setDirty(false);
  };

  const load = useCallback(async () => {
    // 모아보기에서 「이날 고치기」로 오면 ?date=YYYY-MM-DD
    const asked = new URLSearchParams(window.location.search).get('date');
    const start = asked && /^\d{4}-\d{2}-\d{2}$/.test(asked) && asked <= today ? asked : today;
    const from = `${addMonths(monthOf(today), -1)}-01`; // 지난달 1일 ~ 오늘(60일 안팎) — 서버는 한 번에 120일까지
    const list = await fetchSkinLogs(from, today);
    if (list === null) { setGate('locked'); return; }
    const map: Record<string, SkinLog> = Object.fromEntries(list.map((l) => [l.date, l]));
    loadedMonths.current.add(monthOf(from)).add(monthOf(today));
    // 그보다 옛날 날로 들어왔으면 그 날이 걸친 달도 받는다
    for (const ym of new Set([monthOf(addDays(start, -6)), monthOf(start)])) {
      if (loadedMonths.current.has(ym)) continue;
      const last = monthDays(ym).slice(-1)[0];
      const more = await fetchSkinLogs(`${ym}-01`, last);
      if (more) { more.forEach((l) => { map[l.date] = l; }); loadedMonths.current.add(ym); }
    }
    setLogs(map);
    if (!loadedRef.current) {
      loadedRef.current = true;
      setSelected(start);
      setCalYm(monthOf(start));
      openDay(start, map);
    }
    setGate('open');
  }, [today]);

  const ensureMonth = async (ym: string) => {
    if (loadedMonths.current.has(ym) || ym > monthOf(today)) return;
    loadedMonths.current.add(ym);
    setMonthLoading(true);
    try {
      const last = monthDays(ym).slice(-1)[0];
      const list = await fetchSkinLogs(`${ym}-01`, last < today ? last : today);
      if (list) setLogs((m) => ({ ...m, ...Object.fromEntries(list.map((l) => [l.date, l])) }));
    } catch {
      loadedMonths.current.delete(ym);
    } finally {
      setMonthLoading(false);
    }
  };

  useEffect(() => {
    skinSession().then((s) => { setRole(s.role); return s.authed ? load() : setGate('locked'); }).catch(() => setGate('locked'));
  }, [load]);

  const onPin = async (pin: string) => {
    setPinStatus('checking');
    const r = await skinLogin(pin, appUserName());
    if (r === 'ok') { setPinStatus('idle'); setRole((await skinSession()).role); await load(); }
    else setPinStatus(r === 'locked' ? 'locked' : 'bad');
  };

  // 날을 바꿀 때 저장 안 한 변경이 있으면 먼저 저장하고 넘어간다(Aside 검수: 경고 없이 사라짐 — confirm은 앱에서 그냥 넘어가기도 함)
  const pick = async (date: string) => {
    if (date === selected) return;
    if (dirty && !readOnly) {
      const ok = await onSave();
      if (!ok) return; // 저장 실패면 그대로 머문다(저장 막대에 실패 문구)
    }
    setSelected(date);
    openDay(date, logs);
    setCalMode('week');
    setCalYm(monthOf(date));
    void ensureMonth(monthOf(addDays(date, -6)));
  };

  // 보기 전용(우댕 폰)은 값을 안 바꾼다 — 칸 펼치기·사진 보기는 그대로 되게 잠금 대신 여기서만 막는다(우댕: "볼 수 있게는 해줘야지")
  // 막힐 때마다 아래에 짧은 안내(누를 때마다 반응이 있게 — Aside 검수: 한 번 뒤엔 눌러도 반응 없음)
  const [roToast, setRoToast] = useState(false);
  const roTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showReadOnly = () => {
    setRoToast(true);
    if (roTimer.current) clearTimeout(roTimer.current);
    roTimer.current = setTimeout(() => setRoToast(false), 1600);
  };
  const onChange = (patch: Partial<SkinDraft>) => {
    if (readOnly) { showReadOnly(); return; }
    setDraft((d) => ({ ...d, ...patch }));
    if (!dirty) setSavedAt('아직 저장 전이에요'); // 바꾼 직후에도 예전 「…에 저장됨」이 떠서 저장된 줄 알았다(Aside 2차)
    setDirty(true);
  };

  const onSave = async (): Promise<boolean> => {
    if (readOnly) { showReadOnly(); return false; }
    setSaving(true);
    try {
      const log = await saveSkinLog(draft);
      setLogs((m) => ({ ...m, [log.date]: log }));
      setSavedAt(savedAtText(log.updatedAt));
      setDirty(false);
      try { localStorage.removeItem(draftKey(log.date)); } catch {}
      return true;
    } catch {
      setSavedAt('저장 못 했어요 — 다시 눌러 주세요');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 바꿀 때마다 폰에 적어 두기
  useEffect(() => {
    if (!dirty || readOnly) return;
    try { localStorage.setItem(draftKey(draft.date), JSON.stringify({ draft, at: Date.now() })); } catch {}
  }, [draft, dirty, readOnly]);

  // 저장 안 누르고 앱을 내리거나 다른 화면으로 가도 저장(꼼이가 저장 버튼을 잊는 날 대비)
  const autoSave = useRef<() => void>(() => {});
  autoSave.current = () => { if (dirty && !readOnly && !saving) void onSave(); };
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') autoSave.current(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onHide); };
  }, []);
  const leave = async (href: string) => {
    if (dirty && !readOnly && !(await onSave())) return;
    router.push(href);
  };

  const calDay = useCallback((date: string): CalDay => {
    const l = logs[date];
    return { date, uas: l?.uas ?? null, med: medOfDay(l), hasLog: !!l, photo: (l?.photos?.length ?? 0) > 0 };
  }, [logs]);
  // 주 띠: 고른 날이 최근 7일 안이면 오늘까지, 아니면 고른 날을 가운데쯤(오늘은 안 넘김)
  const week = useMemo(() => {
    const end = selected >= addDays(today, -6) ? today : (addDays(selected, 3) < today ? addDays(selected, 3) : today);
    return Array.from({ length: 7 }, (_, i) => calDay(addDays(end, i - 6)));
  }, [calDay, selected, today]);
  const month = useMemo(() => ({ ym: calYm, days: monthDays(calYm).map(calDay) }), [calDay, calYm]);

  if (gate === 'loading') return <div className="sd-app min-h-screen" />;
  if (gate === 'locked') {
    return (
      <div className="sd-app h-[100dvh]">
        <SkinPinGate status={pinStatus} onSubmit={onPin} />
      </div>
    );
  }
  return (
    <SkinScreen>
    <SkinJournalView
      header={{ onBack: () => { void leave('/'); }, onOpenInsights: () => { void leave('/skin/insights'); } }}
      formTitle={readOnly ? '꼼이가 적은 기록' : undefined}
      week={
        <>
          <SkinCalendar
            mode={calMode}
            onMode={(m) => { setCalMode(m); setCalYm(monthOf(selected)); if (m === 'month') void ensureMonth(monthOf(selected)); }}
            week={week}
            month={month}
            today={today}
            selected={selected}
            onSelect={(d) => { void pick(d); }}
            onMonth={(delta) => { const ym = addMonths(calYm, delta); setCalYm(ym); void ensureMonth(ym); }}
            canNextMonth={calYm < monthOf(today)}
            loading={monthLoading}
            onOpenReport={() => { void leave('/skin/report'); }}
          />
        </>
      }
      form={
        <>
        {
        // 우댕 폰(보기 전용)은 입력 폼 대신 읽기 카드 — 칸을 하나하나 열 필요 없이 적힌 게 다 보이게(우댕 2026-10-21, GPT 상담).
        // 사진은 아래 사진 칸에 있으니 카드에선 뺀다. 서버도 requireWriter로 쓰기를 막음
        readOnly
          ? <SkinDayReport day={{ ...toReportDay(selected, logs[selected]), photoCount: 0 }} />
          : <SkinDayForm value={draft} onChange={onChange} onSave={() => { void onSave(); }} saving={saving} savedAt={savedAt} isToday={selected === today} />
        }
        {/* 사진·알림 스위치는 폼 아래로(점수·약이 첫 화면에 오게 — Aside 2차 TOP1). 폼 아래 여백(pb-32)을 당겨 쓰고, 저장 막대에 안 가리게 아래 여백 */}
        <div className={readOnly ? 'mt-4 pb-16' : '-mt-24 pb-40'}>
          <SkinPhotoStrip
            dateLabel={`${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8, 10))}일`}
            photos={photos}
            uploading={uploading}
            onAdd={onAddPhotos}
            onDelete={onDeletePhoto}
            readOnly={readOnly}
          />
          <SkinPartnerAlert on={partnerAlert} readOnly={readOnly} busy={alertBusy} onToggle={toggleAlert} />
          {readOnly && (
            <p className="text-center text-[13px] mt-3" style={{ color: 'var(--sd-muted)' }}>{READ_ONLY_MSG}</p>
          )}
        </div>
        </>
      }
    />
    {roToast && (
      <div role="status" className="fixed inset-x-0 z-50 flex justify-center pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 170px)' }}>
        <span className="px-4 py-2 rounded-full text-[13px] font-bold shadow-lg" style={{ background: 'var(--sd-ink)', color: 'var(--sd-card-solid)' }}>{READ_ONLY_MSG}</span>
      </div>
    )}
    </SkinScreen>
  );
}
