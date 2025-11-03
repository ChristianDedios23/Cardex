import './LoginPageContainer.css'
import logo from '../assets/Cardex-Logo-White.png'
import LoginBoxBorder from './LoginBoxBorder.jsx'

export default function LoginPageContainer(){
    return(
        <div className="loginContainer">
            <img src={logo} alt='Cardex Logo' id='logo'/>
            <LoginBoxBorder/> 
        </div>
    )
}