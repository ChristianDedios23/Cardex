import './MyCollectionContainer.css'
import { FaSearch } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import NavBar from '../NavBar';
import MyCardsContainer from './MyCardsContainer';


export default function MyCollectionContainer() {

    const [myData, setData] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [images, setImages] = useState({});
    const token = sessionStorage.getItem('token');
    const isLoggedIn = !!token


    useEffect(() => {
        displayCards();
        // Enable scrolling for this page
        document.body.style.overflowY = "auto";
        document.body.style.overflowX = "hidden";
        return () => {
            // Reset overflow when leaving this page
            document.body.style.overflow = "hidden";
        };


    }, []);


    useEffect(() => {

    }, [searchTerm]);

    const getImage = async (name, cardID, setID) => {
        try {

            let id = setID.toLowerCase();
            const res = await fetch(`http://localhost:5000/image?pokemonID=${cardID}&setID=${id}`);

            if (!res.ok) {
                console.warn(`No image for "${name}" (status ${res.status})`);
                return "";
            }

            const cardInfo = await res.json();
            return cardInfo.imageLow;
        }
        catch (error) {
            console.error(error);
        }
    }

    const displayCards = async () => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                let id = decoded.id;
                const url = `http://localhost:5000/myCards`;
                const set = await fetch(url,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const setInfo = await set.json();

                if (!setInfo) {
                    alert(`There are no cards available for user.`)
                }
                setData(setInfo || setInfo.length === 0);
            }
            catch (error) {
                console.error(error);
            }
        }
    }


    const searchMyCards = async () => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                let id = decoded.id;
                const url = `http://localhost:5000/getCardInCollection?cardName=${encodeURIComponent(searchTerm)}`;
                const set = await fetch(url,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const setInfo = await set.json();

                if (!setInfo) {
                    alert(`There are no cards available for "${searchTerm}"`)
                }
                setData(setInfo || setInfo.length === 0);
            }
            catch (error) {
                console.error(error);
            }
        }
    }


    useEffect(() => {
        // fetch images for any cards that don't have one yet
        //changed getImage(card.card_name) to card.cardNumber && card.cardName
        myData.forEach((card) => {
            if (!images[card.Card_ID]) {
                getImage(card.Card_Name, card.Card_Number, card.Set_Code)
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



    const handleSearch = () => {
        setSearchTerm(searchTerm.trim());

        if (!searchTerm) {
            displayCards();
            return
        }
        searchMyCards();
    }


    const handleCardRemoved = (cardId, rarityId) => {
        setData(prev =>
            prev.filter(
                card => !(card.Card_ID === cardId && card.Rarity_ID === rarityId)
            )
        );
        displayCards();
    };



    return (
        <div className="page">
            <NavBar />
            <div className='topContent'>{/* Change name*/}
                <div className='searchBarBox'>
                    <FaSearch id='searchIcon' />
                    <input type='text' placeholder='Search cards...' id='cardSearch' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <button onClick={handleSearch} className='cardSearchBtn'>Search</button>


            </div>
            <text className='numCardDisplay'>{myData.length} Cards</text>
            <div className='lineSearch'></div>

            <div className='cardSearchContainer'>
                {myData && myData.map((data) => {
                    return (
                        <MyCardsContainer
                            key={data.Card_ID}
                            id={data.Card_ID}
                            name={data.Card_Name}
                            rarity={data.Rarity_ID}
                            url={images[data.Card_ID]}
                            isLoggedIn={isLoggedIn}
                            onRemoved={handleCardRemoved}
                        />)
                })}

            </div>

        </div>
    )
}