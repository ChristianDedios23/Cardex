import { useEffect } from 'react'
import './CardContainer.css'

export default function CardContainer({ localId, name, rarity, url}){

    const[update, setUpdate] = useState(false)

    useEffect(
        () => {
            // update the db
        }, [update]
    )


    return(
        <div className="cardContainer">
            <h3>{name}</h3>
            <h3>{rarity}</h3>
            <img src={url}></img>
            <div>
                <input type='checkbox' id='currCard' name='addOrRemoveCard' onClick={setUpdate(!update)}/>
            </div>
        </div>
        
    )
}