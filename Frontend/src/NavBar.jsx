import logo1 from './assets/Cardex-Logo-White.png'
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './NavBar.css'

export default function NavBar({}){
    const token = sessionStorage.getItem('token');
        let username;
    
        //Grab username from token
        if(token){
            const decoded = jwtDecode(token);
            username = decoded.username;
        }
    
    return(
        <>
            <div className='topNavBar'>
                <img src={logo1} alt='Cardex Logo' id='logo'/>
                <nav>
                    <Link to='/Home' className='links'>HOME</Link>
                    <Link to='/myCards' className='links'>MY CARDS</Link>
                    <Link to='/Help' className='links'>HELP</Link>
                    <Link to='/Search' className='links'>SEARCH</Link>
                </nav>         
                <Link to='/' id='loginLink' onClick={() => sessionStorage.removeItem('token')}>{username ? 'Welcome ' + username :'REGISTER / LOGIN'}</Link>
            </div>
        </>
    )
}