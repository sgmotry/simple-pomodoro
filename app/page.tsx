import PomodoroTimer from "@/components/PomodoroTimer";

export default function Home() {
  return (
    <div className="mr-auto ml-auto h-[90vh] w-[90vw]">
      <div className="m-5 text-center text-5xl text-shadow-slate-600 text-shadow-xs">
        Simple Pomodoro
      </div>
      <PomodoroTimer />
    </div>
  );
}
