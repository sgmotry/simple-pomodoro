"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  SkipForward,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

type TimerMode = "work" | "rest";
// finished 状態を追加: 作業完了または中断時の結果表示用
type TimerStatus = "idle" | "running" | "paused" | "finished";

// --- サブコンポーネント: 数値入力 ---
type NumberInputProps = {
  label: string;
  valueStr: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

const NumberInput = ({
  label,
  valueStr,
  onChange,
  onBlur,
  onIncrement,
  onDecrement,
}: NumberInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="z-20 flex flex-col items-center">
      <span className="mb-1 text-xs font-medium text-slate-500">{label}</span>
      <div className="group flex h-24 w-20 flex-col items-center justify-center rounded-full border border-slate-100 bg-slate-50 shadow-inner transition-colors focus-within:border-cyan-300">
        <button
          onClick={onIncrement}
          className="p-1 text-slate-400 transition-colors hover:text-cyan-500 focus:outline-none"
          tabIndex={-1}
        >
          <ChevronUp size={20} />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={valueStr}
          maxLength={2}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="my-1 w-full border-none bg-transparent p-0 text-center text-2xl font-bold text-slate-700 focus:ring-0"
        />

        <button
          onClick={onDecrement}
          className="p-1 text-slate-400 transition-colors hover:text-cyan-500 focus:outline-none"
          tabIndex={-1}
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};

export default function PomodoroTimer() {
  // --- 設定値 (Settings) ---
  const [targetLoopsStr, setTargetLoopsStr] = useState("4");
  const [workMinutesStr, setWorkMinutesStr] = useState("25");
  const [restMinutesStr, setRestMinutesStr] = useState("5");

  const targetLoops = parseInt(targetLoopsStr) || 1;

  // --- 実行状態 (Runtime State) ---
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [mode, setMode] = useState<TimerMode>("work");
  const [currentLoop, setCurrentLoop] = useState(1);

  // 累積作業時間 (秒)
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);

  const getInitialTime = () => (parseInt(workMinutesStr) || 25) * 60;
  const [timeLeft, setTimeLeft] = useState(getInitialTime());
  const [totalTime, setTotalTime] = useState(getInitialTime());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 設定変更ロジック ---
  const adjustValue = (
    currentStr: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    delta: number,
  ) => {
    const currentVal = parseInt(currentStr) || 0;
    const newVal = Math.max(1, Math.min(99, currentVal + delta));
    setter(newVal.toString());
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setter(val);
  };

  const handleInputBlur = (
    currentStr: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    let val = parseInt(currentStr);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    setter(val.toString());
  };

  const sanitizeAllInputs = () => {
    const sanitize = (str: string) => {
      let v = parseInt(str);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 99) v = 99;
      return v.toString();
    };

    setTargetLoopsStr((prev) => sanitize(prev));
    const finalWork = sanitize(workMinutesStr);
    setWorkMinutesStr(finalWork);
    setRestMinutesStr((prev) => sanitize(prev));
    return parseInt(finalWork);
  };

  // 設定変更時のプレビュー更新
  useEffect(() => {
    if (status === "idle") {
      const w = parseInt(workMinutesStr) || 25;
      const r = parseInt(restMinutesStr) || 5;
      const newTotalTime = mode === "work" ? w * 60 : r * 60;
      setTimeLeft(newTotalTime);
      setTotalTime(newTotalTime);
    }
  }, [workMinutesStr, restMinutesStr, mode, status]);

  // タイマーカウントダウン & 作業時間計測
  useEffect(() => {
    if (status === "running" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);

        // 作業モード中なら累積時間を加算
        if (mode === "work") {
          setTotalWorkSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && status === "running") {
      handlePhaseComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft, mode]);

  // フェーズ完了処理
  const handlePhaseComplete = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});

    const w = parseInt(workMinutesStr) || 25;
    const r = parseInt(restMinutesStr) || 5;

    if (mode === "work") {
      setMode("rest");
      const t = r * 60;
      setTimeLeft(t);
      setTotalTime(t);
    } else {
      if (currentLoop < targetLoops) {
        setCurrentLoop((prev) => prev + 1);
        setMode("work");
        const t = w * 60;
        setTimeLeft(t);
        setTotalTime(t);
      } else {
        // 全ループ完了 -> 結果画面へ
        finishSession();
        return;
      }
    }
  };

  // --- 操作ハンドラ ---

  const startTimer = () => {
    const finalWorkMinutes = sanitizeAllInputs();
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});
    if (status === "idle") {
      const t = finalWorkMinutes * 60;
      setTimeLeft(t);
      setTotalTime(t);
      // 新規セッション開始時に累積時間をリセット
      setTotalWorkSeconds(0);
    }
    setStatus("running");
  };

  const pauseTimer = () => setStatus("paused");

  // セッション終了（中断または完了）して結果画面へ
  const finishSession = () => {
    setStatus("finished");
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // 完全リセット（結果画面からトップへ戻る）
  const resetToHome = () => {
    setStatus("idle");
    setMode("work");
    setCurrentLoop(1);
    setTotalWorkSeconds(0);
    const w = parseInt(workMinutesStr) || 25;
    const t = w * 60;
    setTimeLeft(t);
    setTotalTime(t);
  };

  const skipPhase = () => handlePhaseComplete();

  // 時間フォーマット (MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 作業時間フォーマット (X時間Y分)
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor((seconds % 3600) % 60);
    return `${h}時間${m}分${s}秒`;
  };

  // --- SVG プログレスバー設定 ---
  const innerSize = 320;
  const progressStrokeWidth = 6;
  const gap = 10;
  const overallSize = innerSize + (gap + progressStrokeWidth) * 2;
  const center = overallSize / 2;
  const radius = center - progressStrokeWidth / 2;
  const circumference = radius * 2 * Math.PI;

  // idle, finished のときはプログレスバーを表示しない、または満タン/空にする
  // ここでは finished のときは満タン表示にする等の演出も可能だが、
  // シンプルにリセットされる挙動にするため progressVal を制御
  const progressVal =
    status === "idle" || totalTime === 0
      ? 0
      : status === "finished"
        ? 1 // 完了時は100%表示のままにする
        : 1 - timeLeft / totalTime;

  const dashOffset = circumference * (1 - progressVal);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
      <div
        className="relative flex items-center justify-center"
        style={{ width: overallSize, height: overallSize }}
      >
        {/* --- SVG プログレスバー --- */}
        <svg
          className="pointer-events-none absolute inset-0 -rotate-90 transform"
          width={overallSize}
          height={overallSize}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={progressStrokeWidth}
            className="transition-colors duration-300"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            // 完了画面ではグレー、それ以外はモードに応じた色
            stroke={
              status === "finished"
                ? "#94a3b8"
                : mode === "work"
                  ? "#22d3ee"
                  : "#f472b6"
            }
            strokeWidth={progressStrokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
            style={{ opacity: status === "idle" ? 0 : 1 }}
          />
        </svg>

        {/* --- メインコンテナ --- */}
        <div
          className="relative z-10 flex flex-col items-center justify-center overflow-hidden rounded-full bg-white shadow-xl transition-all"
          style={{ width: innerSize, height: innerSize }}
        >
          {status === "idle" && (
            /* --- 設定画面 --- */
            <div className="animate-in fade-in zoom-in flex h-full w-full flex-col items-center justify-center space-y-4 duration-300">
              <div className="z-20 -mt-2 flex flex-col items-center">
                <span className="mb-1 text-xs font-bold text-slate-400">
                  ループ
                </span>
                <div className="flex items-center space-x-1 rounded-full border border-slate-100 bg-slate-50 px-2 py-1 transition-colors focus-within:border-cyan-300">
                  <button
                    onClick={() =>
                      adjustValue(targetLoopsStr, setTargetLoopsStr, -1)
                    }
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    <ChevronDown size={16} className="rotate-90" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetLoopsStr}
                    maxLength={2}
                    onChange={(e) => handleInputChange(e, setTargetLoopsStr)}
                    onBlur={() =>
                      handleInputBlur(targetLoopsStr, setTargetLoopsStr)
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && e.currentTarget.blur()
                    }
                    className="w-8 border-none bg-transparent p-0 text-center text-xl font-bold text-slate-700 focus:ring-0"
                  />
                  <button
                    onClick={() =>
                      adjustValue(targetLoopsStr, setTargetLoopsStr, 1)
                    }
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    <ChevronUp size={16} className="rotate-90" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <NumberInput
                  label="作業 (分)"
                  valueStr={workMinutesStr}
                  onChange={(e) => handleInputChange(e, setWorkMinutesStr)}
                  onBlur={() =>
                    handleInputBlur(workMinutesStr, setWorkMinutesStr)
                  }
                  onIncrement={() =>
                    adjustValue(workMinutesStr, setWorkMinutesStr, 1)
                  }
                  onDecrement={() =>
                    adjustValue(workMinutesStr, setWorkMinutesStr, -1)
                  }
                />
                <NumberInput
                  label="休憩 (分)"
                  valueStr={restMinutesStr}
                  onChange={(e) => handleInputChange(e, setRestMinutesStr)}
                  onBlur={() =>
                    handleInputBlur(restMinutesStr, setRestMinutesStr)
                  }
                  onIncrement={() =>
                    adjustValue(restMinutesStr, setRestMinutesStr, 1)
                  }
                  onDecrement={() =>
                    adjustValue(restMinutesStr, setRestMinutesStr, -1)
                  }
                />
              </div>
              <button
                onClick={startTimer}
                className="group z-20 mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-tr from-slate-700 to-slate-900 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Play
                  fill="currentColor"
                  className="ml-1 transition-colors group-hover:text-cyan-200"
                />
              </button>
            </div>
          )}

          {(status === "running" || status === "paused") && (
            /* --- タイマー実行中画面 --- */
            <div className="animate-in fade-in zoom-in flex h-full w-full flex-col items-center justify-center duration-300">
              <div className="mb-4 flex flex-col items-center space-y-1">
                <span className="text-sm font-bold tracking-widest text-slate-400">
                  {currentLoop} / {targetLoops}
                </span>
                <span
                  className={`text-lg font-bold ${mode === "work" ? "text-cyan-600" : "text-pink-500"}`}
                >
                  {mode === "work" ? "作業中" : "休憩中"}
                </span>
              </div>
              <div className="mb-8 font-mono text-5xl font-bold tracking-tight text-slate-800 tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <div className="z-20 flex items-center space-x-6">
                {/* 停止ボタン: リセットではなく結果画面へ遷移 */}
                <button
                  onClick={finishSession}
                  className="rounded-full p-3 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                  title="中断して結果を見る"
                >
                  <Square size={20} fill="currentColor" />
                </button>
                <button
                  onClick={status === "running" ? pauseTimer : startTimer}
                  className="rounded-full bg-slate-800 p-4 text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-700 active:scale-95"
                >
                  {status === "running" ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} fill="currentColor" className="ml-1" />
                  )}
                </button>
                <button
                  onClick={skipPhase}
                  className="rounded-full p-3 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                  title="スキップ"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          )}

          {status === "finished" && (
            /* --- 結果表示画面 --- */
            <div className="animate-in fade-in zoom-in flex h-full w-full flex-col items-center justify-center space-y-2 duration-300">
              <div className="mb-2 text-sm font-bold tracking-widest text-slate-400">
                SESSION END
              </div>

              <div className="text-sm text-slate-500">今回の作業時間</div>
              <div className="mb-6 text-4xl font-bold text-slate-700">
                {formatDuration(totalWorkSeconds)}
              </div>

              <button
                onClick={resetToHome}
                className="flex items-center space-x-2 rounded-full bg-slate-100 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800"
              >
                <RotateCcw size={18} />
                <span>トップへ戻る</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
