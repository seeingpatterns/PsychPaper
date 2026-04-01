import type { CSSProperties } from 'react'

/**
 * 이소메트릭 3D 큐브 그리드 마크 (CodePen 스타일 계승, PsychPaper 색).
 * 장식용 — 스크린리더용 텍스트는 부모 링크에 별도 제공.
 */
const col = (x: string) =>
  ({
    '--x': x,
    '--y': '0',
  }) as CSSProperties

const cell = (i: string) =>
  ({
    '--i': i,
  }) as CSSProperties

function CubeColumn() {
  return (
    <>
      <div className="pp-cube-logo__col" style={col('-1')}>
        <span className="pp-cube-logo__cell" style={cell('3')} />
        <span className="pp-cube-logo__cell" style={cell('2')} />
        <span className="pp-cube-logo__cell" style={cell('1')} />
      </div>
      <div className="pp-cube-logo__col" style={col('0')}>
        <span className="pp-cube-logo__cell" style={cell('3')} />
        <span className="pp-cube-logo__cell" style={cell('2')} />
        <span className="pp-cube-logo__cell" style={cell('1')} />
      </div>
      <div className="pp-cube-logo__col" style={col('1')}>
        <span className="pp-cube-logo__cell" style={cell('3')} />
        <span className="pp-cube-logo__cell" style={cell('2')} />
        <span className="pp-cube-logo__cell" style={cell('1')} />
      </div>
    </>
  )
}

export function PsychPaperCubeLogo() {
  return (
    <div className="pp-cube-logo__stage" aria-hidden="true">
      <div className="pp-cube-logo__inner">
        <div className="pp-cube-logo__cube">
          <CubeColumn />
        </div>
        <div className="pp-cube-logo__cube">
          <CubeColumn />
        </div>
        <div className="pp-cube-logo__cube">
          <CubeColumn />
        </div>
      </div>
    </div>
  )
}
