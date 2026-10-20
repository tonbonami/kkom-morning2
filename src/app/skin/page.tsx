'use client';
// 꼼이 피부 일지 — 기록 화면. 겉모습은 components/skin/*(제미나이 시안, 값 그대로), 여기선 데이터만 연결.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinPinGate from '@/components/skin/SkinPinGate';
import SkinJournalView from '@/components/skin/SkinJournalView';
import SkinWeekStrip from '@/components/skin/SkinWeekStrip';
import SkinDayForm from '@/components/skin/SkinDayForm';
import SkinPhotoStrip from '@/components/skin/SkinPhotoStrip';
import SkinScreen from '@/components/skin/SkinScreen';
import SkinPartnerAlert from '@/components/skin/SkinPartnerAlert';
import type { SkinDraft } from '@/components/skin/skinUi';
import type { SkinLog } from '@/lib/skinTypes';
import {
  READ_ONLY_MSG, addDays, appUserName, deleteSkinPhoto, draftFrom, fetchSkinLogs, fetchSkinPhotos, kstToday, medOfDay,
  fetchSkinSettings, prefillCycle, saveSkinLog, saveSkinSettings, savedAtText, skinLogin, skinSession, uploadSkinPhoto, weekdayOf, type SkinPhotoView, type SkinRole,
} from '@/lib/skinClient';

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

  const load = useCallback(async () => {
    const list = await fetchSkinLogs(addDays(today, -6), today);
    if (list === null) { setGate('locked'); return; }
    const map = Object.fromEntries(list.map((l) => [l.date, l]));
    setLogs(map);
    if (!loadedRef.current) {
      loadedRef.current = true;
      setDraft(prefillCycle(draftFrom(today, map[today]), map[today], map[addDays(today, -1)]));
      setSavedAt(map[today] ? savedAtText(map[today].updatedAt) : null);
    }
    setGate('open');
  }, [today]);

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
    setDraft(prefillCycle(draftFrom(date, logs[date]), logs[date], logs[addDays(date, -1)]));
    setSavedAt(logs[date] ? savedAtText(logs[date].updatedAt) : null);
    setDirty(false);
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
    setDraft((d) => ({ ...d, ...patch })); setDirty(true);
  };

  const onSave = async (): Promise<boolean> => {
    if (readOnly) { showReadOnly(); return false; }
    setSaving(true);
    try {
      const log = await saveSkinLog(draft);
      setLogs((m) => ({ ...m, [log.date]: log }));
      setSavedAt(savedAtText(log.updatedAt));
      setDirty(false);
      return true;
    } catch {
      setSavedAt('저장 못 했어요 — 다시 눌러 주세요');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const l = logs[date];
    return { date, label: weekdayOf(date), uas: l?.uas ?? null, med: medOfDay(l), hasLog: !!l };
  }), [logs, today]);

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
      header={{ onBack: () => router.push('/'), onOpenInsights: () => router.push('/skin/insights') }}
      week={
        <>
          <SkinWeekStrip days={days} selected={selected} onSelect={pick} />
          <SkinPhotoStrip
            dateLabel={`${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8, 10))}일`}
            photos={photos}
            uploading={uploading}
            onAdd={onAddPhotos}
            onDelete={onDeletePhoto}
          />
          <SkinPartnerAlert on={partnerAlert} readOnly={readOnly} busy={alertBusy} onToggle={toggleAlert} />
          {readOnly && (
            <p className="text-center text-[13px] mt-3" style={{ color: 'var(--sd-muted)' }}>{READ_ONLY_MSG}</p>
          )}
        </>
      }
      form={
        // 우댕 폰(보기 전용): 칸은 펼쳐 볼 수 있고, 값 바꾸기·저장만 onChange/onSave에서 막는다. 서버도 requireWriter로 막음
        <SkinDayForm value={draft} onChange={onChange} onSave={() => { void onSave(); }} saving={saving} savedAt={savedAt} isToday={selected === today} />
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
