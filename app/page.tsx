"use client";

import { useState } from "react";
import PomodoroTimer from "@/components/PomodoroTimer";
import Statistics from "@/components/Statistics";
import { Timer, BarChart3 } from "lucide-react";

type Tab = "timer" | "statistics";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("timer");
  const [isTimerLocked, setIsTimerLocked] = useState(false);

  return (
    <div className="mr-auto ml-auto h-[90vh] w-[90vw] font-sans">
      <div className="m-5 text-center text-5xl text-slate-700 text-shadow-slate-400 text-shadow-xs">
        Simple Pomodoro
      </div>

      {/* タブ切り替えボタン */}
      <div className="mb-6 flex justify-center space-x-4">
        <button
          onClick={() => setActiveTab("timer")}
          className={`flex items-center space-x-2 rounded-full px-6 py-2 transition-all duration-300 cursor-pointer ${
            activeTab === "timer"
              ? "scale-105 bg-slate-800 text-white shadow-lg"
              : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          }`}
        >
          <Timer size={18} />
          <span className="font-bold">タイマー</span>
        </button>
        <button
          onClick={() => setActiveTab("statistics")}
          disabled={isTimerLocked} // ロック中はクリック無効
          className={`flex items-center space-x-2 rounded-full px-6 py-2 transition-all duration-300 cursor-pointer ${
            isTimerLocked
              ? "cursor-not-allowed bg-slate-100 text-slate-300 opacity-60"
              : activeTab === "statistics"
                ? "scale-105 bg-slate-800 text-white shadow-lg"
                : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          }`}
        >
          <BarChart3 size={18} />
          <span className="font-bold">統計</span>
        </button>
      </div>

      {/* コンテンツ表示エリア */}
      <div className="transition-opacity duration-300">
        {activeTab === "timer" ? (
          <PomodoroTimer onTimerActiveChange={setIsTimerLocked} />
        ) : (
          <Statistics />
        )}
      </div>
    </div>
  );
}
