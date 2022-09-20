import { useState } from 'preact/hooks'
export default function Visible() {
  const [count, setCount] = useState(42)
  return (
    <div className="border p-6">
      <div className="text-lg">{count}</div>

      <button
        onClick={() => setCount(count + 1)}
        className="border p-4 bg-red-500"
      >
        Increment
      </button>
    </div>
  )
}
