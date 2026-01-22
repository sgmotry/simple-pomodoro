"use client";

import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type WorkLog = {
  id: number;
  date: string;
  duration: number;
};

export default function Statistics() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/worklog");
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // カレンダーの日付生成
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // カレンダーの開始曜日合わせ
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  // ゼロ埋め
  const pad = (num: number) => num.toString().padStart(2, "0");

  // カレンダーセル用: 00:00:00 形式
  const formatTimeHHMMSS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // 月合計用: 00時間00分00秒 形式
  const formatTimeJP = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad(h)}時間${pad(m)}分${pad(s)}秒`;
  };

  // 指定した日付の合計時間を計算
  const getDailyTotal = (date: Date) => {
    const targetLogs = logs.filter((log) =>
      isSameDay(new Date(log.date), date),
    );
    const totalSeconds = targetLogs.reduce((acc, cur) => acc + cur.duration, 0);

    if (totalSeconds === 0) return null;

    // カレンダー内は 00:00:00 形式
    return formatTimeHHMMSS(totalSeconds);
  };

  const changeMonth = (delta: number) => {
    setCurrentDate((prev) => addMonths(prev, delta));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center p-4">
      {/* ヘッダー: 月切り替え */}
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="cursor-pointer rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-2xl font-bold text-slate-700">
          {format(currentDate, "yyyy年 M月", { locale: ja })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="cursor-pointer rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ChevronRight />
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid w-full max-w-4xl grid-cols-7 gap-2">
        {/* 曜日ヘッダー */}
        {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
          <div
            key={day}
            className={classNames(
              "py-2 text-center text-sm font-bold",
              i === 0
                ? "text-pink-400"
                : i === 6
                  ? "text-blue-400"
                  : "text-slate-400",
            )}
          >
            {day}
          </div>
        ))}

        {/* 空白セル */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-video" />
        ))}

        {/* 日付セル */}
        {daysInMonth.map((day) => {
          const dailyTotal = getDailyTotal(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={classNames(
                "relative flex aspect-video flex-col items-center justify-start rounded-xl border p-1 transition-all",
                isToday
                  ? "border-cyan-400 bg-cyan-50"
                  : "border-slate-100 bg-white",
                dailyTotal ? "hover:shadow-md" : "",
              )}
            >
              <span
                className={classNames(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday ? "bg-cyan-500 text-white" : "text-slate-500",
                )}
              >
                {format(day, "d")}
              </span>

              {dailyTotal && (
                <div className="flex w-full flex-1 items-center justify-center">
                  <span className="w-full truncate rounded-md bg-slate-100 px-0.5 text-center text-[10px] font-bold tracking-tighter text-slate-700 sm:text-[1rem]">
                    {dailyTotal}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 統計サマリー */}
      <div className="mt-8 flex gap-8 text-slate-600">
        <div className="flex flex-col items-center">
          <span className="text-xl text-slate-600">今月の合計</span>
          <span className="text-2xl font-bold">
            {(() => {
              const monthLogs = logs.filter(
                (l) =>
                  format(new Date(l.date), "yyyy-MM") ===
                  format(currentDate, "yyyy-MM"),
              );
              const total = monthLogs.reduce(
                (acc, cur) => acc + cur.duration,
                0,
              );

              return formatTimeJP(total);
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}
