import { FaPlus, FaMinus } from 'react-icons/fa';
import './CardContainer.css'

export default function CardContainer({ name, rarity, url }){
    return(
        <div className="cardContainer">
            <img src={url} id='card'></img>
            
            <div className='addRemoveCount'>
                <FaMinus className='minus'/>
                <p className='count'>Count: 0 </p>
                <FaPlus className='plus'/>
            </div>
        </div>
        
    )
}