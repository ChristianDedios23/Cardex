import LoginPageContainer from './LoginPageComponents/LoginPageContainer'
import HomePageContainer from './HomePageComponents/HomePageContainer'
import SearchPageContainer from './CardSearchPageComponents/SearchPageContainer'
import { Routes , Route} from 'react-router-dom'
import MyCollectionContainer from './MyCollectionComponents/MyCollectionContainer'

export default function App() {

  return (
    <Routes>
      <Route path="/" element={<LoginPageContainer/>}/>
      <Route path="/Home" element={ <HomePageContainer/> }/>
      <Route path='/Search' element={ <SearchPageContainer/> }/>
      <Route path='/myCards' element={<MyCollectionContainer/>} />
      {/** Add other paths later */}
    </Routes>
  )
}

