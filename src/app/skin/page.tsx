'use client';
// 꼼이 피부 일지 — 기록 화면. 겉모습은 components/skin/*(제미나이 시안, 값 그대로), 여기선 데이터만 연결.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinPinGate from '@/components/skin/SkinPinGate';
import SkinJournalView from '@/components/skin/SkinJournalView';
import SkinWeekStrip from '@/components/skin/SkinWeekStrip';
import SkinDayForm from '@/components/skin/SkinDayForm';
import type { SkinDraft } from '@/components/skin/skinUi';
import type { SkinLog } from '@/lib/skinTypes';
import {
  addDays, draftFrom, fetchSkinLogs, kstToday, medOfDay, saveSkinLog, savedAtText, skinLogin, skinSession, weekdayOf,
} from '@/lib/skinClient';

type Gate = 'loading' | 'locked' | 'open';

export default function SkinJournalPage() {
  const router = useRouter();
  const today = useMemo(() => kstToday(), []);
  const [gate, setGate] = useState<Gate>('loading');
  const [pinStatus, setPinStatus] = useState<'idle' | 'checking' | 'bad' | 'locked'>('idle');
  const [logs, setLogs] = useState<Record<string, SkinLog>>({});
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState<SkinDraft>(() => draftFrom(today));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const loadedRef = useRef(false);

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
    skinSession().then((s) => (s.authed ? load() : setGate('locked'))).catch(() => setGate('locked'));
  }, [load]);

  const onPin = async (pin: string) => {
    setPinStatus('checking');
    const r = await skinLogin(pin);
    if (r === 'ok') { setPinStatus('idle'); await load(); }
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
    <SkinJournalView
      header={{ onBack: () => router.push('/'), onOpenInsights: () => router.push('/skin/insights') }}
      week={<SkinWeekStrip days={days} selected={selected} onSelect={pick} />}
      form={
        <SkinDayForm value={draft} onChange={onChange} onSave={onSave} saving={saving} savedAt={savedAt} isToday={selected === today} />
      }
    />
  );
}
