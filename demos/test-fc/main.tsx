import React from 'react'
import ReactDOM from 'react-dom/client'

const App = ()=>{
  return (
    // @ts-ignore
    <div key={1111}>111ssssss</div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
     // @ts-ignore
  <App />
)
