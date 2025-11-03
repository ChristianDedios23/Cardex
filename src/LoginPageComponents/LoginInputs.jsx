import './LoginInputs.css'
export default function LoginInputs(){
    return(
        <div className="loginInputs">
            <div className='userNameInput'>
                <label htmlFor="user" className='inputLabel'>Email or Username</label>
                <input type='text' id='user' placeholder='Enter Email or Username...'/>
            </div>
            <div className='passwordInput'>    
                <label htmlFor='pass' className='inputLabel'>Password</label>
                <input type='password' id='pass' placeholder='Enter Password...'/>
            </div>
            {/**Give on change event */}
            <div className='loginButton'>
                <input type='Button' value={'Login'} id='login'/>
            </div> 
        </div>
    )
}