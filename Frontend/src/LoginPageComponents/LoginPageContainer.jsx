import './LoginPageContainer.css'
import logo2 from '../assets/Cardex-Logo-White.png'
import { useState } from "react";

export default function LoginPageContainer(){
    
    const [isLogin, setIsLogin] = useState(true);
    
    
    return(
        <div className="loginContainer">
            <img src={logo2} alt='Cardex Logo' id='logo2'/>
            <div className='loginBoxBorder'>
            <div className="loginInputs">
                

                <div className='emailInput'>
                    <label htmlFor="email" className='inputLabel'>Email</label>
                    <input type='text' id='email' placeholder='Enter Email...'/>
                </div>

                {!isLogin && (
                    <div className='userNameInput'>
                        <label htmlFor="user" className='inputLabel'>Username</label>
                        <input type='text' id='user' placeholder='Enter Username...'/>
                    </div>   
                )}
                

                
                <div className='passwordInput'>    
                    <label htmlFor='pass' className='inputLabel'>Password</label>
                    <input type='password' id='pass' placeholder='Enter Password...'/>
                </div>
                
                {/**Give on change event */}
                <div className='loginButton'>
                    <input type='Button' value={isLogin ? 'Login' : 'Sign-Up'} id='login'/>
                </div> 

                <div className='line'></div>
                
                {isLogin ? 
                    <p className='loginSignUpText'>Need an account? <span className='linkSL' onClick={() => setIsLogin(false)}>SIGN-UP</span></p> : 
                    <p className='loginSignUpText'>Already a user? <span className='linkSL' onClick={() => setIsLogin(true)}>LOGIN</span></p>
                    }
                
            </div>
        </div>
        </div>
    )
}