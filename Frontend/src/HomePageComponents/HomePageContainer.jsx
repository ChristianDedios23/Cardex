import './HomePageContainer.css'
import logo1 from '../assets/Cardex-Logo-White.png'
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import SearchResultsContainer from './SearchResultsContainer';

/*
    Fixes to consider: 
    - Add sign out function

    - Delay searching API until the user stops typing for x-seconds

    - 5 rows displayed at a time, 6 cards per row.
    - Include pages 
*/
export default function HomePageContainer(){
    
    const token = sessionStorage.getItem('token');
    let username;

    //Grab username from token
    if(token){
        const decoded = jwtDecode(token);
        username = decoded.username;
    }

    return(
        <div className='HomePageContainer'>
            
            <div className='topNavBar'>
                <img src={logo1} alt='Cardex Logo' id='logo'/>
                <nav>
                    <Link to='/'>HOME</Link>
                    <Link to='/'>SETS</Link>
                    <Link to='/'>HELP</Link>
                    <Link to='/'>SEARCH</Link>
                </nav>
                
                <Link to='/' id='loginLink' onClick={() => sessionStorage.removeItem('token')}>{username ? 'Welcome ' + username :'REGISTER / LOGIN'}</Link>
            </div>
            <div className='titleSearchContainer'>
                <h1>Cardex</h1>
                <p>A Modern Search Tool For Pokemon</p>
                <div className='searchBar'>
                    <FaSearch id='searchIcon'/>
                    <input type='text' placeholder='Search cards...' id='cardSearch'/>
                </div>
            </div>
            <SearchResultsContainer/>
        </div>
    )
}