import React from "react";

const NoItemFoundModal = ({ message }) => {
  return (

      <div className="w-full h-[250px] bg-gradient-to-l from-bg/90 via-card-bg rounded-2xl flex justify-center items-center">
        <div className="text-center text-text/70">
          <p className="text-lg">{message}</p>
        </div>
      </div>

  );
};

export default NoItemFoundModal;
