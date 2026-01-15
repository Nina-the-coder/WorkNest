import React from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (

      <div className="w-full p-4 flex flex-col bg-bg">
        {/* header */}
        <Header title="Profile" />

        {/* profile */}
        <div className="m-8 p-4 rounded-md bg-card-bg shadow-md space-y-2 w-96">
          <div className="text-secondary-text">
            <div>
              Name : <span className="text-text">{user.name}</span>
            </div>
            <div>
              EmployeeId : <span className="text-text">{user.empId}</span>
            </div>
            <div>
              Email : <span className="text-text">{user.email}</span>
            </div>
            <div>
              Phone : <span className="text-text">{user.phone}</span>
            </div>
            <div>
              Role : <span className="text-text">{user.role}</span>
            </div>
            <div>
              Join Date :{" "}
              <span className="text-text">
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
  );
};

export default Profile;
