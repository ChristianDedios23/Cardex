import './HomePageContainer.css'
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

    const handleGetStarted = (e) => {
        navigate('/Search');
    }

    return(
        <div className='HomePageContainer'>
            
            <NavBar/>
            <div className='titleSearchContainer'>
                <h1>Cardex</h1>
                <p>A Modern Search Tool For Pokemon</p>
                <button className='getStartedBtn' onClick={handleGetStarted}>Get Started</button>
                
            </div>
        </div>
    )
}