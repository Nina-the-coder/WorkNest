import React, { useState } from "react";
import VariantButton from "./VariantButton";
import Icon from "./Icons";

const TaskCard = ({ task, handleEdit, handleDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleReadMore = () => setExpanded(!expanded);
  const previewLength = 120; // characters before Read More
  const isLong = task.description?.length > previewLength;

  return (
    <div className="w-[460px] p-8 bg-card-bg text-secondary-text rounded-2xl bg-gradient-to-r from-bg/80 to-card-bg/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between mb-4">
        {/* top left */}
        <div className="flex flex-col mb-2">
          <div className="text-[20px] mb-1 text-text font-semibold">{task.title}</div>
          <div className="underline">{`${task.assignedTo?.name} (${task.assignedTo?.empId})`}</div>
        </div>

        {/* top right */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div
              className={`h-[16px] w-[80px] ${
                task.status === "done"
                  ? "bg-green"
                  : task.status === "in-progress"
                  ? "bg-orange"
                  : "bg-red"
              } rounded-2xl text-[14px] flex justify-center items-center text-black`}
            >
              {task.status}
            </div>
            <div className="flex items-center mr-4">
              <div
                className={`ml-2 h-[16px] w-[16px] ${
                  task.priority === "low"
                    ? "bg-green"
                    : task.priority === "medium"
                    ? "bg-orange"
                    : "bg-red"
                } rounded-2xl text-[14px] flex justify-center items-center text-black`}
              ></div>
              <span className="ml-1 text-text/90">{task.priority}</span>
            </div>
          </div>

          <div className="text-text/90">
            Due Date:{" "}
            <Icon name="calendar" className="inline h-[16px] w-[16px] mr-1" />
            {new Date(task.dueDate)
              .toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              .toUpperCase()}
          </div>
        </div>
      </div>

      {/* middle (description) */}
      <div
        className={`text-justify transition-all duration-300 ${
          expanded ? "h-auto" : "h-[120px] overflow-hidden"
        }`}
      >
        <p>
          {expanded || !isLong
            ? task.description
            : task.description.slice(0, previewLength) + "..."}
        </p>
        {isLong && (
          <button
            onClick={toggleReadMore}
            className="mt-2 text-blue-500 hover:underline text-sm font-medium"
          >
            {expanded ? "Read Less" : "Read More"}
          </button>
        )}
      </div>

      {/* bottom */}
      <div className="align-baseline flex justify-end mr-4 mt-4">
        <VariantButton
          onClick={handleEdit}
          variant="ghostCta"
          size="small"
          text="Edit"
          icon="pen"
          className="mr-4"
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

export default TaskCard;
