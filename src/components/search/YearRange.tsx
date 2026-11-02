'use client'

interface Props {
  bounds: { min: number; max: number }
  value?: [number, number]
  onChange: (range: [number, number]) => void
}

export function YearRange({ bounds, value, onChange }: Props) {
  const [start, end] = value || [bounds.min, bounds.max]
  const span = bounds.max - bounds.min || 1
  return <section aria-label="수상 연도 범위" className="border-t border-slate-100 pt-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-sm font-bold">수상 연도</h4>
      <output className="text-sm font-bold text-primary" aria-live="polite">{start}년 ~ {end}년</output>
      <button type="button" onClick={() => onChange([bounds.min, bounds.max])} className="text-xs text-slate-500 underline">전체 연도</button>
    </div>
    <div className="relative mx-3 my-4 h-8">
      <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-slate-200" />
      <div className="absolute top-3 h-2 rounded-full bg-primary" style={{ left: `${(start - bounds.min) / span * 100}%`, right: `${(bounds.max - end) / span * 100}%` }} />
      <input aria-label="시작 연도" type="range" min={bounds.min} max={bounds.max} step={1} value={start} disabled={bounds.min === bounds.max}
        onChange={e => onChange([Math.min(Number(e.target.value), end), end])} style={{ zIndex: start === end && start > bounds.min ? 3 : 1 }} className="year-range-handle" />
      <input aria-label="종료 연도" type="range" min={bounds.min} max={bounds.max} step={1} value={end} disabled={bounds.min === bounds.max}
        onChange={e => onChange([start, Math.max(Number(e.target.value), start)])} style={{ zIndex: 2 }} className="year-range-handle" />
    </div>
    <div className="flex justify-between text-xs text-slate-500"><span>{bounds.min}년</span><span>{bounds.max}년</span></div>
    <p className="mt-2 text-xs text-slate-500">양쪽 손잡이로 수상 연도 범위를 조절하세요. 학년·문제 유형·SCAMPER 필터와 함께 적용됩니다.</p>
  </section>
}
