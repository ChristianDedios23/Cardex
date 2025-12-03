import './SearchPageContainer.css'
import { FaSearch } from 'react-icons/fa';
import { useEffect } from 'react';
import NavBar from '../NavBar';
import CardContainer from './CardContainer';

export default function SearchPageContainer(){
    
    useEffect(() => {
        // Enable scrolling for this page
        document.body.style.overflowY = "auto";
        document.body.style.overflowX = "hidden";

        return () => {
        // Reset overflow when leaving this page
        document.body.style.overflow = "hidden";
            };
    }, []);

    return(
        <div className="page">
            <NavBar/>
            <div className='topContent'>{/* Change name*/}
                <div className='searchBarBox'>
                    <FaSearch id='searchIcon'/>
                    <input type='text' placeholder='Search cards...' id='cardSearch'/>
                </div>
                
                
                <label>
                    <input type='radio' id='allOption' name='filter'/>
                    <span className='checkmark'></span>
                    All
                </label>

                <label>
                    <input type='radio' id='inCollectionOption' name='filter'/>
                    <span className='checkmark'></span>
                    In Collection
                </label>

                <label>
                    <input type='radio' id='notInCollectionOption' name='filter'/>
                    <span className='checkmark'></span>
                    Not In Collection
                </label>
             
    
                
            </div>
            <text className='numCardDisplay'>30/63432 Cards</text>
            <div className='lineSearch'></div>
            
            <div className='cardSearchContainer'>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
                <CardContainer/>     
                <CardContainer/>
                <CardContainer/>
              
            </div>
        </div>
    )
}