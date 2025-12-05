import { useEffect } from 'react'
import './CardContainer.css'

export default function CardContainer({ localId, name, rarity, url}){




    return(
        <div className="cardContainer">
            <h3>{name}</h3>
            <h3>{rarity}</h3>
            <img src={url}></img>
            <div>
                <input type='checkbox' id='currCard' name='addOrRemoveCard' />
            </div>
        </div>
        
    )
}