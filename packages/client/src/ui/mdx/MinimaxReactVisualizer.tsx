import { Code, Database, Layers, Maximize, MousePointer2, Terminal, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useRevealProgress } from "../../features/presentation/reveal/useRevealStep";

type StepTheme = "default" | "blue" | "purple" | "green";

interface StepInfo {
  id: number;
  title: string;
  subtitle: string;
  desc: string;
  theme: StepTheme;
  icon: typeof Maximize;
}

const steps: StepInfo[] = [
  {
    id: 0,
    icon: Maximize,
    title: "Browser Environment",
    subtitle: "浏览器运行时",
    desc: "网页运行在浏览器宿主环境中，用户最先看到的是最终渲染出的像素平面。",
    theme: "default",
  },
  {
    id: 1,
    icon: Layers,
    title: "3D Perspective",
    subtitle: "开发者视角",
    desc: "切换视角看分层结构。我们需要透过界面现象，理解 React 的内部组织。",
    theme: "blue",
  },
  {
    id: 2,
    icon: MousePointer2,
    title: "DOM / UI Layer",
    subtitle: "视图层",
    desc: "这一层是用户可见的界面，对应组件最终渲染出来的 UI 结果。",
    theme: "blue",
  },
  {
    id: 3,
    icon: Code,
    title: "Component Logic",
    subtitle: "组件逻辑层",
    desc: "JSX 与组件函数定义业务逻辑，决定界面如何组织与如何响应。",
    theme: "purple",
  },
  {
    id: 4,
    icon: Database,
    title: "State (Hooks)",
    subtitle: "数据状态层",
    desc: "useState 等 Hooks 托管数据源，数据变化触发重渲染并推动界面更新。",
    theme: "green",
  },
];

const themeClassMap: Record<StepTheme, string> = {
  default: "text-white border-slate-500",
  blue: "text-blue-400 border-blue-400",
  purple: "text-purple-400 border-purple-400",
  green: "text-emerald-400 border-emerald-400",
};

export function MinimaxReactVisualizer() {
  const { reveal, step: revealStep } = useRevealProgress(steps.length - 1);
  const [manualStep, setManualStep] = useState(0);
  const step = reveal ? revealStep : manualStep;

  const likes = 42 + (step >= 3 ? 1 : 0) + (step >= 4 ? 1 : 0);

  const camera = useMemo(() => {
    if (step <= 0) return { x: 0, y: 0, perspective: 900 };
    if (step === 1) return { x: 10, y: 25, perspective: 860 };
    if (step === 2) return { x: 14, y: 32, perspective: 840 };
    if (step === 3) return { x: 20, y: 39, perspective: 820 };
    return { x: 24, y: 44, perspective: 780 };
  }, [step]);

  const layerTransform = {
    ui: step >= 2 ? 90 : 2,
    code: step >= 3 ? 190 : 70,
    state: step >= 4 ? 260 : 120,
  };

  const active = steps[step];
  const ActiveIcon = active.icon;
  const activeTheme = themeClassMap[active.theme];

  return (
    <section className="relative flex size-full overflow-hidden bg-[#1c1c1c] text-white">
      <div className="flex min-w-0 flex-[1.8] items-center justify-center overflow-hidden border-r border-[#333]">
        <div
          className="relative h-[520px] w-[420px]"
          style={{ perspective: `${camera.perspective}px` }}
        >
          <div
            className="relative h-full w-full transition-transform duration-700"
            style={{
              transformStyle: "preserve-3d",
              transform: step === 0 ? undefined : `rotateX(${camera.x}deg) rotateY(${camera.y}deg)`,
            }}
          >
            <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-[#3b3b3b] bg-[#1f1f1f] shadow-2xl">
              <div className="flex h-11 items-center gap-3 border-b border-[#333] bg-[#202020] px-3">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full border border-[#444] bg-red-500" />
                  <div className="size-3 rounded-full border border-[#444] bg-amber-500" />
                  <div className="size-3 rounded-full border border-[#444] bg-emerald-500" />
                </div>
                <div className="flex h-6 flex-1 items-center rounded-md border border-[#333] bg-[#151515] px-3 font-mono text-xs text-[#7b7b7b]">
                  localhost:3000
                </div>
              </div>
              <div className="relative grid flex-1 place-items-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: "radial-gradient(#333 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="relative z-10 text-center font-mono text-sm text-[#8a8a8a]">
                  <Terminal size={24} className="mx-auto mb-2 opacity-60" />
                  <div>Runtime Environment</div>
                </div>
              </div>
            </div>

            <div
              className="absolute left-8 right-8 top-24 flex h-[320px] flex-col items-center rounded-xl border border-[#3e3e3e] bg-[#252525] p-8 shadow-2xl transition-all duration-700"
              style={{ transform: `translate3d(0, 0, ${layerTransform.ui}px)` }}
            >
              <div className="mb-6 grid size-20 place-items-center rounded-full border border-[#2f2f2f] bg-gradient-to-br from-[#1f2937] to-[#0f172a] text-xl font-bold shadow-lg">
                H
              </div>
              <div className="text-[28px] font-bold">@海拉鲁编程客</div>
              <div className="mb-8 font-mono text-lg text-[#b0b0b0]">讲知识的段子手</div>
              <div className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#333] bg-[#151515] px-4 py-3">
                <ThumbsUp size={16} className="text-gray-300" />
                <span
                  className="rounded bg-blue-600 px-2.5 py-0.5 font-mono text-sm font-bold text-white transition-transform duration-300"
                  style={{ transform: `scale(${step >= 3 ? 1.1 : 1})` }}
                >
                  {likes}
                </span>
              </div>
            </div>

            <div
              className="pointer-events-none absolute left-8 right-8 top-32 h-64 rounded-xl border border-purple-500/40 bg-[#1c1c1c]/85 p-6 shadow-xl transition-all duration-700"
              style={{
                transform: `translate3d(0, 0, ${layerTransform.code}px)`,
                opacity: step >= 3 ? 1 : 0,
              }}
            >
              <div className="font-mono text-[13px] leading-relaxed text-gray-200">
                <div>
                  <span className="text-purple-400">const</span>{" "}
                  <span className="text-blue-400">App</span> = () =&gt; {"{"}
                </div>
                <div className="mb-1 pl-4 text-[11px] text-gray-500">// Logic Definition</div>
                <div className="pl-4">
                  <span className="text-purple-400">return</span> (
                </div>
                <div className="pl-6">
                  {"<"}
                  <span className="text-blue-400">Card</span>
                  {">"}
                  <br />
                  &nbsp;&nbsp;{"<"}
                  <span className="text-blue-400">Status</span> /{">"}
                  <br />
                  &nbsp;&nbsp;{"<"}
                  <span className="text-blue-400">Counter</span> /{">"}
                  <br />
                  {"</"}
                  <span className="text-blue-400">Card</span>
                  {">"}
                </div>
                <div className="pl-4">);</div>
                <div>{"}"}</div>
              </div>
            </div>

            <div
              className="pointer-events-none absolute left-16 right-16 top-40 flex h-44 items-center justify-center rounded-lg border border-dashed border-emerald-400 bg-[#1c1c1c]/90 transition-all duration-700"
              style={{
                transform: `translate3d(0, 0, ${layerTransform.state}px)`,
                opacity: step >= 4 ? 1 : 0,
              }}
            >
              <div className="text-center">
                <div className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
                  点赞数
                </div>
                <div className="inline-flex items-center gap-3 rounded-lg border border-emerald-400/40 bg-[#151515] px-4 py-2">
                  <Database size={16} className="text-emerald-400" />
                  <span className="font-mono text-2xl font-bold tabular-nums text-white">
                    {likes}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-[1.2] flex-col justify-between bg-[#1c1c1c] p-14">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="size-2 rounded-full bg-emerald-500" />
            <div className="font-mono text-xl uppercase tracking-[0.2em] text-gray-500">
              Visualizer
            </div>
          </div>
          <div className="pl-10">
            <div
              className={`absolute mt-1 -ml-10 grid size-8 place-items-center rounded-full border bg-[#1c1c1c] ${activeTheme}`}
            >
              <ActiveIcon size={14} />
            </div>
            <div className="rounded-xl border border-[#333] bg-[#252525] p-8">
              <div
                className={`mb-3 font-mono text-lg font-bold uppercase tracking-wider ${activeTheme.split(" ")[0]}`}
              >
                0{active.id + 1} // {active.title}
              </div>
              <div className="mb-4 text-[32px] font-bold text-white">{active.subtitle}</div>
              <div className="text-[22px] leading-relaxed text-[#c8c8c8]">{active.desc}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setManualStep(item.id)}
              className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
                step === item.id
                  ? "border-[#4a4a4a] bg-[#2a2a2a]"
                  : "border-transparent bg-[#202020] hover:border-[#333]"
              }`}
            >
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-full border bg-[#151515] ${themeClassMap[item.theme]}`}
              >
                <item.icon size={16} />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-sm uppercase tracking-[0.16em] text-gray-500">
                  0{item.id + 1}
                </div>
                <div className="truncate text-xl font-semibold text-white">{item.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}
