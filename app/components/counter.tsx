import { useState } from "react";

/** Counter コンポーネントの props。初期値と増減ステップを任意で受ける。 */
export type CounterProps = {
  initial?: number;
  step?: number;
};

/** 初期値から step 刻みで増減するカウンター。表示値は内部状態で保持する。 */
export function Counter({ initial = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initial);

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body items-center text-center">
        <h2 className="card-title">Counter</h2>
        <p className="text-3xl font-bold tabular-nums" aria-label="count">
          {count}
        </p>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setCount((c) => c - step)}
          >
            -{step}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCount((c) => c + step)}
          >
            +{step}
          </button>
        </div>
      </div>
    </div>
  );
}
