// @ts-ignore
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const App = () => {
  const [num, setNum] = useState(100);
  const arr = num % 2 == 0 ?
    [
      <li key='1'>1</li>,
      <li key='2'>2</li>,
      <li key='3'>3</li>,
      <li key='4'>4</li>,
      <li key='5'>5</li>,
    ] :
    [
      <li key='1'>1</li>,
      <li key='2'>2</li>,
      <li key='4'>4</li>,
      <li key='3'>3</li>,
      <li key='5'>5</li>,
      // https://github.com/BetaSu/big-react/commit/

    ];
  // console.log("arr", arr)
  return (
    <div style={{ "backgroundColor": "red" }} key={'111'} onClick={() => { setNum(num + 1) }}>
      {
        num % 2 == 0 && <>
          <p>1</p>
          <p>2</p>

          <Child />
        </>
      }
      {arr}
    </div>
  )
}

const Child = (props) => {
  return (
    <>
      <h1>1</h1>
      <h1>2</h1>
    </>
  )
}
// console.log("jsx", (
//   <>
//     <p>1</p>
//     <p>2</p>
//   </>
// ))

ReactDOM.createRoot(document.getElementById('root')!).render(
  // @ts-ignore
  <App h="1" />
)
