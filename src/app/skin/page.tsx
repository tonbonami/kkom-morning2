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
import type { SkinDraft } from '@/components/skin/skinUi';
import type { SkinLog } from '@/lib/skinTypes';
import {
  READ_ONLY_MSG, addDays, appUserName, deleteSkinPhoto, draftFrom, fetchSkinLogs, fetchSkinPhotos, kstToday, medOfDay,
  saveSkinLog, savedAtText, skinLogin, skinSession, uploadSkinPhoto, weekdayOf, type SkinPhotoView, type SkinRole,
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
    if (readOnly) { window.alert(READ_ONLY_MSG); return; }
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
    if (readOnly) { window.alert(READ_ONLY_MSG); return; }
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
      setDraft(draftFrom(today, map[today]));
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

  const pick = (date: string) => {
    if (date === selected) return;
    if (dirty && !window.confirm('저장하지 않은 기록이 있어요. 다른 날로 넘어갈까요?')) return;
    setSelected(date);
    setDraft(draftFrom(date, logs[date]));
    setSavedAt(logs[date] ? savedAtText(logs[date].updatedAt) : null);
    setDirty(false);
  };

  const onChange = (patch: Partial<SkinDraft>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };

  const onSave = async () => {
    setSaving(true);
    try {
      const log = await saveSkinLog(draft);
      setLogs((m) => ({ ...m, [log.date]: log }));
      setSavedAt(savedAtText(log.updatedAt));
      setDirty(false);
    } catch {
      setSavedAt('저장 못 했어요 — 다시 눌러 주세요');
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
          {readOnly && (
            <p className="text-center text-[13px] mt-3" style={{ color: 'var(--sd-muted)' }}>{READ_ONLY_MSG}</p>
          )}
        </>
      }
      form={
        // 우댕 폰(보기 전용)은 칸을 전부 잠근다 — 서버도 쓰기를 막는다(requireWriter)
        <fieldset disabled={readOnly} style={{ display: 'contents' }}>
          <SkinDayForm value={draft} onChange={onChange} onSave={onSave} saving={saving} savedAt={savedAt} isToday={selected === today} />
        </fieldset>
      }
    />
    </SkinScreen>
  );
}
