import LoginPageContainer from './LoginPageComponents/LoginPageContainer'
import HomePageContainer from './HomePageComponents/HomePageContainer'
import './App.css'
import { Routes , Route} from 'react-router-dom'

export default function App() {

  return (
    <Routes>
      <Route path="/" element={ <HomePageContainer/> }/>
      <Route path="/Login" element={<LoginPageContainer/>}/>
      {/** Add other paths later */}
    </Routes>
  )
}

