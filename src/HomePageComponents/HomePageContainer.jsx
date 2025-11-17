import './HomePageContainer.css'
import logo from '../assets/Cardex-Logo-White.png'
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

export default function HomePageContainer(){
    
    return(
        <div className='HomePageContainer'>
            
            <div className='topNavBar'>
                <img src={logo} alt='Cardex Logo' id='logo'/>
                <nav>
                    <Link to='/Login'>HOME</Link>
                    <Link to='/Login'>SETS</Link>
                    <Link to='/Login'>HELP</Link>
                    <Link to='/Login'>SEARCH</Link>
                </nav>
                
                <Link to='/Login' id='loginLink'>REGISTER / LOGIN</Link>
            </div>
            <div className='titleSearchContainer'>
                <h1>Cardex</h1>
                <p>A Modern Search Tool For Pokemon</p>
                <div className='searchBar'>
                    <FaSearch id='searchIcon'/>
                    <input type='text' placeholder='Search cards...' id='cardSearch'/>
                </div>
            </div>
        </div>
    )
}