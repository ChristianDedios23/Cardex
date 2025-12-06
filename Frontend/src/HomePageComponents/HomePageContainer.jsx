import './HomePageContainer.css'
import { FaSearch } from 'react-icons/fa';
import NavBar from '../NavBar';
import { useNavigate } from 'react-router-dom';

/*
    Fixes to consider: 
    - Add sign out function

    - Delay searching API until the user stops typing for x-seconds

    - 5 rows displayed at a time, 6 cards per row.
    - Include pages 
*/
export default function HomePageContainer(){
    const navigate = useNavigate();

    const handleKeyPress = () => {
        navigate('/Search');
    }

    return(
        <div className='HomePageContainer'>
            
            <NavBar/>
            <div className='titleSearchContainer'>
                <h1>Cardex</h1>
                <p>A Modern Search Tool For Pokemon</p>
                <div className='button'>
                    <input button='text' placeholder='Get Started' id='cardSearchHome' onClick={handleKeyPress}/>
                </div>
            </div>
        </div>
    )
}