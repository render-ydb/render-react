// @ts-ignore
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
  const [num, setNum] = useState(100);
  const arr = num % 2 == 0 ?
    [
      <li key='1'>1</li>,
      <li key='2'>2</li>,
      <li key='3'>3</li>
    ] :
    [
      <li key='3'>3</li>,
      <li key='2'>2</li>,
      <li key='1'>1</li>,
      // https://github.com/BetaSu/big-react/commit/

    ];
    console.log("arr",arr)
  return (
    <div style={{"backgroundColor":"red"}} key={'111'} onClick={() => { setNum(num + 1) }}>
      {arr}
    {/* <p><span>{num}</span></p>   */}
    </div>
  )
}

const Child = (props) => {
  return (
    <ul>
      {/* {arr} */}
      {props.children}
    </ul>
  )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App h="1" />
)
