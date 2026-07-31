import { useEffect, useRef, useState, type CSSProperties } from 'react'

// 5행 × 3열 — 1 = P의 일부(파랑), 0 = 배경(희미)
const P_CELLS = new Set(['0,0','0,1','0,2','1,0','1,2','2,0','2,1','3,0','4,0'])

const ROWS = 5
const COLS = 3
const SPIN_MS = 620       // 한 행의 스핀 지속
const STAGGER_MS = 420    // 행 간 딜레이
const COLOR_AT = 0.47     // 스핀 중 이 비율에서 색 전환 (행이 invisible 구간)
const HOLD_MS = 3000      // P 유지 시간
const RESET_MS = 450      // 리셋 페이드 시간

type CellState = 'idle' | 'blue' | 'dim'
type RowAnim  = 'idle' | 'spinning'

interface AnimState {
  rowAnim: RowAnim[]
  cells: CellState[][]
}

const INIT: AnimState = {
  rowAnim: Array(ROWS).fill('idle') as RowAnim[],
  cells: Array.from({ length: ROWS }, () => Array(COLS).fill('idle') as CellState[]),
}

export function PsychPaperPAnimation() {
  const [anim, setAnim] = useState<AnimState>(INIT)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function clear() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function at(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }

  useEffect(() => {
    function cycle() {
      clear()
      setAnim(INIT)

      for (let r = 0; r < ROWS; r++) {
        const t0 = 350 + r * STAGGER_MS

        // 1. 스핀 시작
        at(() => setAnim(prev => ({
          ...prev,
          rowAnim: prev.rowAnim.map((v, i) => (i === r ? 'spinning' : v)),
        })), t0)

        // 2. 색 전환 (행이 invisible 구간)
        at(() => setAnim(prev => ({
          ...prev,
          cells: prev.cells.map((row, ri) =>
            ri === r
              ? row.map((_, ci) => (P_CELLS.has(`${r},${ci}`) ? 'blue' : 'dim'))
              : row
          ),
        })), t0 + SPIN_MS * COLOR_AT)

        // 3. 스핀 종료 → transition 복구
        at(() => setAnim(prev => ({
          ...prev,
          rowAnim: prev.rowAnim.map((v, i) => (i === r ? 'idle' : v)),
        })), t0 + SPIN_MS + 40)
      }

      // 4. 전체 완료 후 유지 → 리셋 → 반복
      const done = 350 + (ROWS - 1) * STAGGER_MS + SPIN_MS + 40
      at(() => {
        setAnim(prev => ({
          ...prev,
          cells: Array.from({ length: ROWS }, () => Array(COLS).fill('idle') as CellState[]),
        }))
        at(cycle, RESET_MS + 300)
      }, done + HOLD_MS)
    }

    const t = setTimeout(cycle, 400)
    return () => { clearTimeout(t); clear() }
  }, [])

  return (
    <div className="pp-p-anim" aria-hidden="true">
      <div className="pp-p-anim__inner">
        {/* 행 순서 0→4 : 나중 행(하단)이 앞에 쌓임 — 아이소메트릭 깊이 */}
        {Array.from({ length: ROWS }, (_, r) => (
          <div
            key={r}
            className={`pp-p-anim__row${anim.rowAnim[r] === 'spinning' ? ' pp-p-anim__row--spin' : ''}`}
            style={{ '--row': r } as CSSProperties}
          >
            {/* 열 역순(2→0) 렌더: 마지막 DOM = col0 = 아이소메트릭 앞 */}
            {[2, 1, 0].map(c => (
              <span
                key={c}
                className={`pp-p-anim__cell pp-p-anim__cell--${anim.cells[r][c]}`}
                style={{ '--col': c } as CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
