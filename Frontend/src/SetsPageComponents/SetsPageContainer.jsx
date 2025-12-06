import { FaSearch } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import NavBar from '../NavBar';
import SetContainer from './SetContainer';

export default function SetsPageContainer() {

    const[searchTerm, setSearchTerm] = useState('');
    const[filter, setFilter] = useState('');

    const handleSearch = () => {
        console.log(searchTerm);
    }

    return (
        <div className="page">
                    <NavBar />
                    <div className='topContent'>{/* Change name*/}
                        <div className='searchBarBox'>
                            <FaSearch id='searchIcon' />
                            <input type='text' placeholder='Search cards...' id='cardSearch' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <button onClick={handleSearch}>Search</button>
                        </div>
        
        
                        <label>
                            <input defaultChecked type='radio' id='allOption' name='filter' onChange={(e) => setFilter("all")} />
                            <span className='checkmark'></span>
                            All
                        </label>
        
                        <label>
                            <input type='radio' id='inProgress' name='filter' onChange={(e) => setFilter("inProgress")} />
                            <span className='checkmark'></span>
                            In Progress
                        </label>
        
                        <label>
                            <input type='radio' id='complete' name='filter' onChange={(e) => setFilter("complete")} />
                            <span className='checkmark'></span>
                            Completed
                        </label>
        
                    </div>

                    <div>
                        
                    </div>
                
                </div>
    )
}