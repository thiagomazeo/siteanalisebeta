export function Card({ children, className = '' }) {
  return (
    <div className={`border rounded-lg shadow-md bg-white ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  )
}