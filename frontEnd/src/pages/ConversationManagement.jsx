import React from "react";
import Sidebar from "../components/Sidebar";

const ConversationManagement = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Conversation Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>
      </div>
    </div>
  );
};

export default ConversationManagement;