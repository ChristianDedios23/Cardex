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





    const getImage = async (name) => {
        try {

            const lower = name.toLowerCase();

            console.log(`fetching response for ${name}`);
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${lower}`);
            console.log("parsing response");
            const cardInfo = await res.json();

            if (!res.ok) {
                console.warn(`No PokéAPI entry for "${name}" (status ${res.status})`);
                return "";   // no image for this card
            }

            console.log("Finished");
            console.log(cardInfo);
            return cardInfo.sprites.front_default;
        }
        catch (error) {
            console.error(error);
        }

    }





    const getSearchedCard = async () => {
        try {

            const url = `http://localhost:5000/getCard?cardName=${encodeURIComponent(searchTerm)}`;

            console.log(`fetching response for ${searchTerm}`);
            const card = await fetch(url);
            console.log("parsing response");
            const cardInfo = await card.json();
            console.log("Finished");
            console.log(cardInfo);
            setData(cardInfo);
        }
        catch (error) {
            console.error(error);
        }
    }

    const getSearchedSet = async () => {
        try {

            const url = `http://localhost:5000/getSet?setName=${encodeURIComponent(searchTerm)}`;

            console.log(`fetching response for ${searchTerm}`);
            const set = await fetch(url);
            console.log("parsing response");
            const setInfo = await set.json();
            console.log("Finished");
            console.log(setInfo);
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
                console.log(`fetching response for ${searchTerm}`);
                const set = await fetch(url);
                console.log("parsing response");
                const setInfo = await set.json();
                console.log("Finished");
                console.log(setInfo);
                setData(setInfo);
            }
            catch (error) {
                console.error(error);
            }
        }
    }

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            console.log("Didnt search");
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
        myData.forEach((card) => {
            if (!images[card.Card_ID]) {
                getImage(card.Card_Name)
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
                    <button onClick={handleSearch}>Search</button>
                    <button onClick={getImage}>image</button>
                </div>


                <label>
                    <input defaultChecked type='radio' id='allOption' name='filter' onChange={(e) => setFilter("card")} />
                    <span className='checkmark'></span>
                    Card
                </label>

                <label>
                    <input type='radio' id='inCollectionOption' name='filter' onChange={(e) => setFilter("set")} />
                    <span className='checkmark'></span>
                    Set
                </label>

                <label>
                    <input type='radio' id='InCollection' name='filter' onChange={(e) => setFilter("collectionSearch")} />
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