import { FaPlus, FaMinus } from 'react-icons/fa';
import './MyCardsContainer.css'
import { useEffect, useState } from 'react';

export default function myCardsContainer({ id, name, rarity, url, isLoggedIn, onRemoved}) {

    const [quantity, setQuantity] = useState(0);
    const token = sessionStorage.getItem('token');


    const fetchQuantity = async () => {
        try {
            const res = await fetch(
                `http://localhost:5000/getQuantity?cardId=${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            if (!res.ok) {
                console.error(res.status);
            }
            const data = await res.json();
            setQuantity(data[0]?.Quantity ?? 0);

        } catch (err) {
            console.error(err);
        }

    };



    useEffect(() => {
        if (!isLoggedIn || !id) return;
        fetchQuantity();
    }, [id, isLoggedIn, token]);



    const addCard = async () => {
        try {
            const res = await fetch('http://localhost:5000/addCard',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        cardId: id,
                        variantId: rarity,
                        quantity: 1,
                    }),
                }
            );
            if (!res.ok) {
                console.error(res.status);
            } else {
                console.log('Added/Updated successfully!');
                await fetchQuantity();
            }

        } catch (err) {
            console.error(err);
        }
    };



    const removeCard = async () => {
        if (quantity > 0) {
            try {
                const res = await fetch(`http://localhost:5000/removeCard?cardId=${id}&variantId=${rarity}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (!res.ok) {
                    console.error(res.status);
                    return;
                } 

                if(quantity === 1) {
                    onRemoved?.(id,rarity);
                } else {
                    await fetchQuantity();
                }
                console.log('Removed successfully!');


            } catch (err) {
                console.error(err);
            }
        }
    };





    return (
        <div className="cardContainer">
            <img src={url} id='card'></img>
            {isLoggedIn && (
                <div className='addRemoveCount'>
                    <FaMinus className='minus' onClick={removeCard}/>
                    <p className='count'>Count: {quantity}</p>
                    <FaPlus className='plus' onClick={addCard} />
                </div>
            )}
        </div>

    )
}