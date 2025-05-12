import { useState } from 'react'
import AllRoute from './allroute/AllRoute'
import Header from './component/Header'
import './index.css';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <div className=''>
      <Header/>
      <button ></button>
     <AllRoute/>

     </div>
    </>
  )
}

export default App