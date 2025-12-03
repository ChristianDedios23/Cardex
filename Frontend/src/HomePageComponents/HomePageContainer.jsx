import './HomePageContainer.css'
import { FaSearch } from 'react-icons/fa';
import NavBar from '../NavBar';

/*
    Fixes to consider: 
    - Add sign out function

    - Delay searching API until the user stops typing for x-seconds

    - 5 rows displayed at a time, 6 cards per row.
    - Include pages 
*/
export default function HomePageContainer(){
    
    // const token = sessionStorage.getItem('token');
    // let username;

    // //Grab username from token
    // if(token){
    //     const decoded = jwtDecode(token);
    //     username = decoded.username;
    // }

    return(
        <div className='HomePageContainer'>
            
            <NavBar/>
            <div className='titleSearchContainer'>
                <h1>Cardex</h1>
                <p>A Modern Search Tool For Pokemon</p>
                <div className='searchBar'>
                    <FaSearch id='searchIcon'/>
                    <input type='text' placeholder='Search cards...' id='cardSearchHome'/>
                </div>
            </div>
        </div>
    )
}