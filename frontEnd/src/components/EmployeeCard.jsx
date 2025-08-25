import React from "react";
import Icon from "./Icons";
import VariantButton from "./VariantButton";

const EmployeeCard = ({ emp, handleEdit, handleDelete }) => {
  const colors = [
    "bg-red-600",
    "bg-green-700",
    "bg-yellow-700",
    "bg-purple-600",
    "bg-pink-700",
  ];
  const color = colors[emp.name.length % colors.length];

  return (
    <div
      key={emp.empId}
      className="w-[332px] bg- h-[280px] p-4 flex flex-col bg-card-bg text-secondary-text rounded-2xl bg-gradient-to-r from-bg/80 to-card-bg/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* top */}
      <div className="flex">
        <div
          className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[32px] ${color} mr-1`}
        >
          {emp.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <div className="relative top-2.5 left-2 text-[18px] text-text font-semibold">
            {emp.name}
          </div>
          <div className="flex items-center">
            <div className="border w-[160px] h-0"></div>
            <div
              className={`h-[16px] w-[60px] ${
                emp.status === "active" ? "bg-green" : "bg-orange"
              } rounded-2xl text-[14px] flex justify-center items-center text-black`}
            >
              {emp.status}
            </div>
          </div>
        </div>
      </div>
                                  
      {/* center */}
      <div className="my-2">
        <div className="mt-4 ml-4">
          EmpId: <span className="text-text ">{emp.empId}</span>
        </div>
        <div className="mt-1 ml-4">
          Email:{" "}
          <span className="text-text ">
            {" "}
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${emp.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {emp.email}
            </a>
          </span>
        </div>
        <div className="mt-1 ml-4">
          Role: <span className="text-text ">{emp.role}</span>
        </div>
        <div className="mt-1 ml-4 mb-4">
          Phone: <span className="text-text ">{emp.phone}</span>
        </div>
      </div>

      {/* bottom */}
      <div className="flex gap-8 ml-2">
        <VariantButton
          onClick={handleEdit}
          variant="ghostCta"
          size="small"
          text="Edit"
          icon="pen"
        />

        <VariantButton
          variant="ghostRed"
          onClick={handleDelete}
          size="small"
          text="Delete"
          icon="trash-2"
        />
      </div>
    </div>
  );
};

export default EmployeeCard;

// import React from "react";
// import Icon from "./Icons";

// const EmployeeCard = ({ emp, handleEdit, handleDelete }) => {
//   const colors = [
//     "bg-red-600",
//     "bg-green-700",
//     "bg-yellow-700",
//     "bg-purple-600",
//     "bg-pink-700",
//   ];
//   const color = colors[emp.name.length % colors.length];

//   return (
//     <div
//       key={emp.empId}
//       className="w-full max-w-sm bg-card-bg text-secondary-text rounded-2xl shadow-md p-5 flex flex-col"
//     >
//       {/* top */}
//       <div className="flex items-center gap-3">
//         <div
//           className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white text-xl font-bold ${color}`}
//         >
//           {emp.name.charAt(0).toUpperCase()}
//         </div>
//         <div className="flex-1">
//           <div className="text-lg font-semibold text-text">{emp.name}</div>
//           <div
//             className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
//               emp.status === "active"
//                 ? "bg-green-400 text-black"
//                 : "bg-orange-400 text-black"
//             }`}
//           >
//             {emp.status}
//           </div>
//         </div>
//       </div>

//       {/* center */}
//       <div className="mt-4 space-y-1 text-sm">
//         <div>
//           <span className="font-medium text-text">EmpId:</span>{" "}
//           {emp.empId}
//         </div>
//         <div>
//           <span className="font-medium text-text">Email:</span>{" "}
//           {emp.email}
//         </div>
//         <div>
//           <span className="font-medium text-text">Role:</span>{" "}
//           {emp.role}
//         </div>
//         <div>
//           <span className="font-medium text-text">Phone:</span>{" "}
//           {emp.phone}
//         </div>
//       </div>

//       {/* bottom */}
//       <div className="flex gap-3 mt-5">
//         <button
//           onClick={handleEdit}
//           className="flex items-center gap-1 px-3 py-1 rounded-lg border border-cta text-cta hover:bg-cta hover:text-white transition"
//         >
//           <Icon name="pen" className="h-[18px] w-[18px]" />
//           Edit
//         </button>
//         <button
//           onClick={handleDelete}
//           className="flex items-center gap-1 px-3 py-1 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
//         >
//           <Icon name="trash-2" className="h-[18px] w-[18px]" />
//           Delete
//         </button>
//       </div>
//     </div>
//   );
// };

// export default EmployeeCard;
