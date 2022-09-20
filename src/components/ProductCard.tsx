import { IProduct } from '../types'
import { useState } from 'preact/hooks'

interface ProductCardProps {
  product: IProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  const [details, setDetails] = useState(false)

  const toggle = () => setDetails((prev) => !prev)

  return (
    <div className="border rounded mb-2 p-3">
      <h2 className="lext-lg">{product.title}</h2>
      <p className="font-bold">{product.price}</p>

      <a href={`/product/${product.id}`}>Open product</a>

      <br />

      <button
        onClick={toggle}
        className="border py-2 px-4 bg-yellow-400 text-white"
      >
        Toggle Description
      </button>

      {details && <p>{product.description}</p>}
    </div>
  )
}
