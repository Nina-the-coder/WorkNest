import React from "react";
import Sidebar from "../components/Sidebar";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Profile</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* profile */}
        <div className="mt-6 p-4 rounded-md bg-slate-800 shadow-md space-y-2 w-full md:w-1/2">
          <div className="text-white">
            <div>
              Name : <span className="text-slate-300">{user.name}</span>
            </div>
            <div>
              EmployeeId : <span className="text-slate-300">{user.empId}</span>
            </div>
            <div>
              Email : <span className="text-slate-300">{user.email}</span>
            </div>
            <div>
              Phone : <span className="text-slate-300">{user.phone}</span>
            </div>
            <div>
              Role : <span className="text-slate-300">{user.role}</span>
            </div>
            <div>
              Join Date :{" "}
              <span className="text-slate-300">
                {new Date(user.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
