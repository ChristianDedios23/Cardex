import './SearchPageContainer.css'
import { FaSearch } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import NavBar from '../NavBar';
import CardContainer from './CardContainer';


export default function SearchPageContainer() {

    const [myData, setData] = useState([])
    const [filter, setFilter] = useState("card")
    const [searchTerm, setSearchTerm] = useState("")
    const [image, setImage] = useState("")
    const [images, setImages] = useState({});
    const token = sessionStorage.getItem('token');

    useEffect(() => {
        // Enable scrolling for this page
        document.body.style.overflowY = "auto";
        document.body.style.overflowX = "hidden";
        return () => {
            // Reset overflow when leaving this page
            document.body.style.overflow = "hidden";
        };
    }, []);

    const getImage = async (name, cardID) => {
        try {

            console.log(`fetching response for image ${name}`);
            const res = await fetch(`http://localhost:5000/image?pokemonID=${cardID}`);
            console.log("parsing response");

            if (!res.ok) {
                console.warn(`No image for "${name}" (status ${res.status})`);
                return "";   // no image for this card
            }

            const cardInfo = await res.json();

            console.log("Finished");
            console.log(cardInfo);
            return cardInfo.imageLow;
        }
        catch (error) {
            console.error(error);
        }
    }

    const getSearchedCard = async () => {
        try {

            const url = `http://localhost:5000/getCard?cardName=${encodeURIComponent(searchTerm)}`;

            const card = await fetch(url);
            
            const cardInfo = await card.json();
            
            if(!cardInfo || cardInfo.length === 0){
                alert(`There are no cards available for "${searchTerm}"`);
            }
            setData(cardInfo);
        }
        catch (error) {
            console.error(error);
        }
    };

    const getSearchedSet = async () => {
        try {
            const url = `http://localhost:5000/getSet?setName=${encodeURIComponent(searchTerm)}`;
            const set = await fetch(url);
            const setInfo = await set.json();        
            
            if(!setInfo || setInfo.length === 0){
                alert(`There are no cards available for set "${searchTerm}"`)
            }

            setData(setInfo); 
        }
        catch (error) {
            console.error(error);
        }
    }

    const getSearchedInCollection = async () => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                let id = decoded.id;
                const url = `http://localhost:5000/getCardInCollection?cardName=${encodeURIComponent(searchTerm)}&userID=${id}`;
               
                const set = await fetch(url);
               
                const setInfo = await set.json();
             
                if(!setInfo){
                    alert(`There are no cards available for "${searchTerm}"`)
                }
                setData(setInfo || setInfo.length === 0);
            }
            catch (error) {
                console.error(error);
            }
        }
    }

    const handleSearch = () => {
        setSearchTerm(searchTerm.trim());

        if (!searchTerm) {
            alert(`There are no cards available for '${searchTerm}'`)
            return
        }
        if (filter == 'card') {
            getSearchedCard();
        }
        if (filter == 'set') {
            getSearchedSet();
        }
        if (filter == 'collectionSearch') {
            getSearchedInCollection();
        }
    }

    useEffect(() => {
        // fetch images for any cards that don't have one yet
        //changed getImage(card.card_name) to card.cardNumber && card.cardName
        myData.forEach((card) => {
            if (!images[card.Card_ID]) {
                getImage(card.Card_Name, card.Card_Number)
                    .then((url) => {
                        setImages((prev) => ({
                            ...prev,
                            [card.Card_ID]: url,   // store url for this card
                        }));
                    })
                    .catch((err) => console.error("Image fetch error:", err));
            }
        });
    }, [myData]);


    return (
        <div className="page">
            <NavBar />
            <div className='topContent'>{/* Change name*/}
                <div className='searchBarBox'>
                    <FaSearch id='searchIcon' />
                    <input type='text' placeholder='Search cards...' id='cardSearch' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                
                <button onClick={handleSearch} className='cardSearchBtn'>Search</button>

                <label>
                    <input defaultChecked type='radio' name='filter' onChange={(e) => setFilter("card")} />
                    <span className='checkmark'></span>
                    Card
                </label>

                <label>
                    <input type='radio' name='filter' onChange={(e) => setFilter("set")} />
                    <span className='checkmark'></span>
                    Set
                </label>

                <label>
                    <input type='radio' name='filter' onChange={(e) => setFilter("collectionSearch")} />
                    <span className='checkmark'></span>
                    In Collection
                </label>

            </div>
            <text className='numCardDisplay'>{myData.length} Cards</text>
            <div className='lineSearch'></div>

            <div className='cardSearchContainer'>
                {myData && myData.map((data) => {
                    return (
                        <CardContainer
                            key={data.Card_ID}
                            name={data.Card_Name}
                            rarity={data.Rarity_ID}
                            url={images[data.Card_ID]}
                        />)
                })}
                
            </div>

        </div>
    )
}