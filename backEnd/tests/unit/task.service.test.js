const TaskService = require("../../src/modules/task/task.service");
const taskRepo = require("../../src/modules/task/task.repository");
const getNextSequence = require("../../src/utils/getNextSequence");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/task/task.repository");
jest.mock("../../src/utils/getNextSequence");

describe("Task Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addTask", () => {

    test("should create a task with generated taskId", async () => {

      getNextSequence.mockResolvedValue(1);

      const taskData = {
        assignedTo: "EMP001",
        assignedBy: "EMP002",
        title: "New Task",
        description: "Task description",
        status: "pending",
        priority: "high"
      };

      taskRepo.createTask.mockResolvedValue({
        taskId: "TSK001",
        ...taskData
      });

      const result = await TaskService.addTask(taskData);

      expect(getNextSequence).toHaveBeenCalledWith("task");
      expect(taskRepo.createTask).toHaveBeenCalled();
      expect(result.taskId).toBe("TSK001");

    });

  });

  describe("getAllTasks", () => {

    test("should return all tasks", async () => {

      const tasks = [{ title: "Task1" }];

      taskRepo.findAllActive.mockResolvedValue(tasks);

      const result = await TaskService.getAllTasks();

      expect(taskRepo.findAllActive).toHaveBeenCalled();
      expect(result).toEqual(tasks);

    });

  });

  describe("deleteTask", () => {

    test("should soft delete task", async () => {

      const mockTask = { taskId: "TSK001" };

      taskRepo.findByTaskId.mockResolvedValue(mockTask);

      await TaskService.deleteTask("TSK001");

      expect(mockTask.deleted).toBe(true);
      expect(taskRepo.saveTask).toHaveBeenCalledWith(mockTask);

    });

    test("should throw error if task not found", async () => {

      taskRepo.findByTaskId.mockResolvedValue(null);

      await expect(
        TaskService.deleteTask("TSK001")
      ).rejects.toThrow(AppError);

    });

  });

  describe("getTaskById", () => {

    test("should return task", async () => {

      const task = { title: "Task1" };

      taskRepo.findActiveByTaskId.mockResolvedValue(task);

      const result = await TaskService.getTaskById("TSK001");

      expect(result).toEqual(task);

    });

    test("should throw error if task not found", async () => {

      taskRepo.findActiveByTaskId.mockResolvedValue(null);

      await expect(
        TaskService.getTaskById("TSK001")
      ).rejects.toThrow(AppError);

    });

  });

  describe("updateTask", () => {

    test("should update task successfully", async () => {

      const mockTask = {
        title: "Old title"
      };

      taskRepo.findActiveByTaskId.mockResolvedValue(mockTask);
      taskRepo.saveTask.mockResolvedValue(mockTask);

      const updatedData = {
        title: "New title"
      };

      const result = await TaskService.updateTask("TSK001", updatedData);

      expect(mockTask.title).toBe("New title");
      expect(taskRepo.saveTask).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);

    });

    test("should throw error if task not found", async () => {

      taskRepo.findActiveByTaskId.mockResolvedValue(null);

      await expect(
        TaskService.updateTask("TSK001", {})
      ).rejects.toThrow(AppError);

    });

  });

});