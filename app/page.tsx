import PomodoroTimer from "@/components/PomodoroTimer";

export default function Home() {
  return (
    <div className="h-[90vh] w-[90vw] ml-auto mr-auto">
      <div className="m-5 text-center text-5xl text-shadow-slate-600 text-shadow-xs">Simple Pomodoro</div>
      <PomodoroTimer/>
    </div>
  );
}
