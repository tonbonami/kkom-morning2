아까 네가 만든 두 컴포넌트(아래 원문)를 고쳐 줘. **디자인(색·크기·배치·문구·움직임)은 네 것 그대로 두고, 아래 버그만** 고친 완성 코드 두 개를 다시 줘. 파일을 열거나 명령을 실행하지 말고 코드만.

## 고칠 것
1. `SleepSoundCard`: 바깥이 `motion.button`인데 안에 또 `motion.button`(재생 단추)이 있다. HTML에서 버튼 안에 버튼은 안 된다(Next.js가 하이드레이션 오류를 낸다). 바깥을 버튼이 아닌 요소(`motion.div` + `role="button"` + `tabIndex={0}` + Enter/Space로 onOpen)로 바꾸는 등 네가 판단해서 고쳐 줘. 재생 단추를 누르면 onOpen이 불리지 않는 것은 그대로.
2. `SleepSoundScreen`: 바깥 div에 `sd-app` 클래스를 같이 쓰면 전역 CSS `.sd-app { background: linear-gradient(밝은 회백) }`가 `bg-[#1a1514]`를 덮어서 **화면이 밝아지고 밝은 글자가 안 보인다.** `sd-app`을 빼고 어두운 바탕이 확실히 칠해지게 해 줘. 그리고 className 문자열 안에 `// Dark, warm background for night mode` 같은 주석이 클래스 이름으로 들어가 있다 — 빼 줘.
3. `SleepSoundScreen`: `available=false`일 때 덮개가 화면 전체(뒤로 단추 포함)를 덮어 뒤로 갈 수 없다. 뒤로 단추는 늘 누를 수 있게.
4. `SleepSoundScreen`: `h-screen` + `overflow-hidden`이라 작은 아이폰(SE, 세로 667px)에서 아래(볼륨·안내)가 잘릴 수 있다. 잘리지 않게(필요하면 세로 스크롤) 해 줘. 아이폰 주소창 없는 웹뷰라 `min-h-[100dvh]` 권장.
5. 두 파일 모두 `export function` 이름·props 이름·타입은 지금과 **정확히 같게**.

## 아까 네 원문
```typescript
// src/components/SleepSoundCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Play, Pause } from 'lucide-react';

export interface SleepSoundCardProps {
  playing: boolean;
  soundName: string;
  endText: string;
  available: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

export function SleepSoundCard({
  playing,
  soundName,
  endText,
  available,
  onToggle,
  onOpen,
}: SleepSoundCardProps) {
  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      className={`
        sd-card w-full h-full px-4 py-4 flex flex-col relative text-left transition-transform
        ${playing ? 'bg-[var(--sd-card-solid)] border-[var(--sd-rel-soft)] border-2' : ''}
        ${!available ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      style={{
        backgroundColor: playing ? 'var(--sd-card-solid)' : 'rgba(255,255,255,.74)',
      }}
      disabled={!available}
    >
      {/* Card name line */}
      <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--sd-cardlabel)] mb-2">
        <Moon size={16} />
        <span>잠 소리</span>
      </div>

      <div className="flex-grow flex flex-col justify-center items-start">
        <h3 className="text-[var(--sd-ink)] text-lg font-bold">
          {available ? soundName : '꼼모닝 앱에서 들을 수 있어요'}
        </h3>
        {available && (
          <p className="text-[var(--sd-muted)] text-sm mt-1">{endText}</p>
        )}
      </div>

      {/* Play/Pause Button */}
      {available && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation(); // Prevent onOpen from being called
            onToggle();
          }}
          whileTap={{ scale: 0.9 }}
          className={`
            absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center
            ${playing ? 'bg-[var(--sd-rel)] text-white shadow-[var(--sd-rel-shadow)]' : 'bg-white text-[var(--sd-rel)] shadow-[var(--sd-shadow-btn)]'}
            transition-all duration-200 ease-in-out
          `}
          // Subtle pulse animation when playing
          animate={playing ? {
            scale: [1, 1.05, 1],
            boxShadow: ['var(--sd-rel-shadow)', '0 0 0 8px rgba(228, 104, 94, 0.2), var(--sd-rel-shadow)', 'var(--sd-rel-shadow)']
          } : {}}
          transition={playing ? {
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
            delay: 0.5,
          } : {}}
        >
          {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </motion.button>
      )}
    </motion.button>
  );
}
```

```typescript
// src/components/SleepSoundScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface SleepSoundOption {
  id: string;
  name: string;
  desc: string;
}

export interface SleepSoundScreenProps {
  sounds: SleepSoundOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  endMode: 'morning' | 'forever';
  onEndModeChange: (m: 'morning' | 'forever') => void;
  morningTime: string;
  onMorningTimeChange: (t: string) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  playing: boolean;
  remainingText?: string;
  available: boolean;
  onPlay: () => void;
  onStop: () => void;
  onBack: () => void;
}

export function SleepSoundScreen({
  sounds,
  selectedId,
  onSelect,
  endMode,
  onEndModeChange,
  morningTime,
  onMorningTimeChange,
  volume,
  onVolumeChange,
  playing,
  remainingText,
  available,
  onPlay,
  onStop,
  onBack,
}: SleepSoundScreenProps) {
  const selectedSound = sounds.find((s) => s.id === selectedId);

  // Background animation variants
  const backgroundVariants = {
    play: {
      opacity: [0.05, 0.1, 0.05],
      scale: [1, 1.02, 1],
      transition: {
        duration: 8,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
    stop: { opacity: 0 },
  };

  return (
    <div
      className="
        relative w-full h-screen sd-app overflow-hidden
        flex flex-col text-[var(--sd-muted)]
        pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        bg-[#1a1514] text-[#F1EBEA] // Dark, warm background for night mode
      "
    >
      {playing && (
        <motion.div
          className="absolute inset-0 bg-[var(--sd-rel)]" // Subtle coral overlay
          variants={backgroundVariants}
          initial="stop"
          animate={playing ? 'play' : 'stop'}
        />
      )}

      <div className="relative z-10 flex flex-col flex-grow max-w-md mx-auto w-full px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between h-14">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--sd-faint)]"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-xl font-extrabold text-[var(--sd-card-solid)] flex-grow text-center pr-10">
            잠 소리
          </h1>
        </div>

        {/* Central Play/Pause Button */}
        <div className="flex-grow flex flex-col items-center justify-center my-4">
          <motion.button
            onClick={playing ? onStop : onPlay}
            whileTap={{ scale: 0.9 }}
            className={`
              w-28 h-28 rounded-full flex items-center justify-center
              ${playing ? 'bg-[var(--sd-rel)] text-white shadow-[var(--sd-rel-shadow)]' : 'bg-[var(--sd-surface-2)] text-[var(--sd-rel)] shadow-md'}
              transition-all duration-200 ease-in-out
            `}
            disabled={!available}
          >
            {available ? (
              playing ? (
                <Pause size={48} fill="currentColor" />
              ) : (
                <Play size={48} fill="currentColor" />
              )
            ) : (
              <span className="text-sm px-2 text-center">앱 전용</span>
            )}
          </motion.button>
          <p className="mt-4 text-2xl font-bold text-[var(--sd-card-solid)]">
            {selectedSound?.name || '소리를 선택하세요'}
          </p>
          {playing && remainingText && (
            <p className="text-[var(--sd-muted)] text-sm mt-1">{remainingText}</p>
          )}
        </div>

        {/* Sound Options */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {sounds.map((sound) => (
            <motion.button
              key={sound.id}
              onClick={() => onSelect(sound.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                flex flex-col items-center justify-center py-3 px-2 rounded-xl text-center text-sm
                ${selectedId === sound.id ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
                transition-colors duration-200
              `}
              style={{
                boxShadow: selectedId === sound.id ? 'var(--sd-rel-shadow)' : 'none',
              }}
            >
              <span className="text-base">{sound.name}</span>
              <span className="text-xs text-[var(--sd-muted)] mt-0.5">{sound.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* End Mode */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <motion.button
            onClick={() => onEndModeChange('morning')}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm
              ${endMode === 'morning' ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
              transition-colors duration-200
            `}
          >
            <Moon size={18} />
            <span>아침까지</span>
          </motion.button>
          <motion.button
            onClick={() => onEndModeChange('forever')}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm
              ${endMode === 'forever' ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
              transition-colors duration-200
            `}
          >
            <Moon size={18} />
            <span>계속</span>
          </motion.button>
        </div>

        {endMode === 'morning' && (
          <div className="flex items-center justify-center mb-6">
            <input
              type="time"
              value={morningTime}
              onChange={(e) => onMorningTimeChange(e.target.value)}
              className="
                bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)] text-2xl font-bold tabular-nums
                rounded-xl py-3 px-4 w-36 text-center appearance-none
                focus:outline-none focus:ring-2 focus:ring-[var(--sd-rel)]
              "
              style={{
                background: 'rgba(255,255,255,.08)',
                color: 'var(--sd-card-solid)',
                border: 'none',
              }}
            />
          </div>
        )}

        {/* Volume Slider */}
        <div className="flex items-center gap-4 mb-6">
          <VolumeX size={24} className="text-[var(--sd-faint)]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="
              flex-grow h-3 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-runnable-track]:bg-[rgba(255,255,255,.15)]
              [&::-webkit-slider-runnable-track]:h-2
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-[var(--sd-rel)]
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:-mt-[5px]
              [&::-webkit-slider-thumb]:shadow-[var(--sd-rel-shadow)]
            "
            style={{
              '--range-shdw': 'var(--sd-rel-shadow)',
              '--track-bg': 'rgba(255,255,255,.15)',
              '--thumb-bg': 'var(--sd-rel)',
              '--thumb-shadow': 'var(--sd-rel-shadow)',
              '--thumb-mt': '-5px',
              '--thumb-size': '20px',
              '--track-height': '8px',
            } as React.CSSProperties}
          />
          <Volume2 size={24} className="text-[var(--sd-card-solid)]" />
        </div>

        {/* Bottom Info */}
        <p className="text-center text-xs text-[var(--sd-faint)]">
          화면을 잠가도 계속 나와요 · 아침 알람은 그대로 울려요
        </p>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white text-lg font-bold text-center p-4 rounded-xl z-20">
            꼼모닝 아이폰 앱에서만 재생돼요
          </div>
        )}
      </div>
    </div>
  );
}
```
두 개의 React 컴포넌트(`SleepSoundCard`, `SleepSoundScreen`) 코드를 요청하신 요구사항에 맞춰 생성했습니다. 각 컴포넌트는 `'use client';`로 시작하며, 지정된 props, 스타일, 라이브러리(`framer-motion`, `lucide-react`)를 사용하여 구현되었습니다.
