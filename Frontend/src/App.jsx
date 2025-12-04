import LoginPageContainer from './LoginPageComponents/LoginPageContainer'
import HomePageContainer from './HomePageComponents/HomePageContainer'
import SearchPageContainer from './CardSearchPageComponents/SearchPageContainer'
import { Routes , Route} from 'react-router-dom'

export default function App() {

  return (
    <Routes>
      <Route path="/" element={<LoginPageContainer/>}/>
      <Route path="/Home" element={ <HomePageContainer/> }/>
      <Route path='/Search' element={ <SearchPageContainer/> }/>
      {/** Add other paths later */}
    </Routes>
  )
}

