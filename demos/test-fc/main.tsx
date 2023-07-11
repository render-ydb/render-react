import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
  const [num, setNum] = useState(100);
  //@ts-ignore
  window.setNum =setNum;
  return (
    // @ts-ignore
    <div key={1111}>{num}</div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App />
)
