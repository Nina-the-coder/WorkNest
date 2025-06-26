import React from "react";
import Worknestlogo from "../assets/WorknestLogo.jpg";

const Login = () => {
  return (
    <>
      <div className="navbar h-15 p-1.5 w-full ">
        <img className="h-full" src={Worknestlogo} />
      </div>

      <div className="main flex flex-col justify-center items-center mt-8">
        <div className="login h-fit w-150 p-8 mt-8 border-2 rounded-lg">
          <div className="text-3xl mt-4 mb-8 text-center">Login</div>
          <form>

            <label htmlFor="email" className="w-full">Email</label> 
            <input id="email" name='email' className="w-full border mb-4 p-0.5" type="text"></input>

            <label htmlFor="password" className="w-full">Password</label>
            <input id="password" name='password' className="w-full border mb-4 p-0.5" type="password"></input>

            <label htmlFor="role" className="w-full">Role</label>
            <select id='role' name='role' className="w-full border mb-4 p-0.5" placeholder="Select a role">
              <option>Employee</option>
              <option>Admin</option>
            </select>

            <button className="w-full h-10 text-white bg-gray-700 mt-4 hover:bg-gray-800 cursor-pointer " type='submit'>Login</button>

          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
