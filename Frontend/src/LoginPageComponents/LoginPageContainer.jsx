import './LoginPageContainer.css'
import logo2 from '../assets/Cardex-Logo-White.png'
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';

/*
    Fixes to consider: 
    - Message takes time to display for server error,
        decrease time it takes for message to display.
    
    - Add forgot password functionality
*/
export default function LoginPageContainer(){

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); //Displays message based on action
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        //prevent page reload
        e.preventDefault();

        //assign url based on state of page
        const url = isLogin ? 'http://localhost:5000/login' : 'http://localhost:5000/signup'
        
        //assign body based on state of page
        const body = isLogin ? {email, password} : {email, username, password}
        try{
            //make request and get back result
            const res = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)  
            });

            //returns the body from the request
            const data = await res.json();

            //If status is not 200/201, then res.ok returns false and
            //displays the current problem in message.
            if(!res.ok) {
                setIsSuccess(false);
                setMessage(data.message);
                return;
            }

            setIsSuccess(true); //login/signup was successful

            //Login phase
            if(isLogin){
                sessionStorage.setItem('token', data.token);
                setMessage(data.message);
                navigate('/Home');
            }

            //Sign-Up phase
            else{
                setMessage(data.message);
                setIsLogin(true);
                setEmail('');
                setPassword('');
                setUsername('');
            }
        }
        catch(err){
            console.error(err);
            setMessage('Server error. Try again');    
        }
    }

    
    return(
        <div className="loginContainer">
            
            <img src={logo2} alt='Cardex Logo' id='logo2'/>
            <div className='loginBoxBorder'>
            <div className="loginInputs">
                

                <div className='emailInput'>
                    <label htmlFor="email" className='inputLabel'>Email</label>
                    <input type='text' id='email' onChange={(e) => {setEmail(e.target.value)}} placeholder='Enter Email...'/>
                </div>

                {!isLogin && (
                    <div className='userNameInput'>
                        <label htmlFor="user" className='inputLabel'>Username</label>
                        <input type='text' id='user' onChange={(e) => {setUsername(e.target.value)}}placeholder='Enter Username...'/>
                    </div>   
                )}
                
                <div className='passwordInput'>    
                    <label htmlFor='pass' className='inputLabel'>Password</label>
                    <input type='password' id='pass' onChange={(e) => {setPassword(e.target.value)}} placeholder='Enter Password...'/>
                </div>
                
                <div className='loginButton'>
                    <input type='Button' value={isLogin ? 'Login' : 'Sign-Up'} id='login' onClick={handleSubmit}/>
                </div> 

                <div className='line'></div>
                
                {/*Change the text color based on error or success*/}
                {message && <p className='loginSignUpText' style={ isSuccess ? {color : 'green'} : {color : 'red'}}>{message}</p>}

                {isLogin ? 
                    <p className='loginSignUpText'>Need an account? <span className='linkSL' onClick={() => {setIsLogin(false); setMessage('');}}>SIGN-UP</span></p> : 
                    <p className='loginSignUpText'>Already a user? <span className='linkSL' onClick={() => {setIsLogin(true); setMessage('');}}>LOGIN</span></p>
                    }
                
            </div>
        </div>
        </div>
    )
}