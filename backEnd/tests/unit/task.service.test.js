const TaskService = require("../../src/modules/task/task.service");
const taskRepo = require("../../src/modules/task/task.repository");
const getNextSequence = require("../../src/utils/getNextSequence");
const AppError = require("../../src/utils/AppError");
const User = require("../../src/models/user.model");

jest.mock("../../src/modules/task/task.repository");
jest.mock("../../src/utils/getNextSequence");
jest.mock("../../src/models/user.model", () => ({ findOne: jest.fn() }));

describe("Task Service", () => {
  const admin = { _id: "admin-user-id", role: "admin" };
  const employee = { _id: "employee-a-id", role: "employee" };

  beforeEach(() => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ role: "employee", status: "active" }) });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("addTask", () => {

    test("should create a task with generated taskId", async () => {

      getNextSequence.mockResolvedValue(1);

      const taskData = {
        assignedTo: "507f1f77bcf86cd799439011",
        assignedBy: "EMP002",
        title: "New Task",
        description: "Task description",
        dueDate: "2030-01-01",
        status: "pending",
        priority: "high"
      };

      taskRepo.createTask.mockResolvedValue({
        taskId: "TSK001",
        ...taskData
      });

      const result = await TaskService.addTask(taskData, admin);

      expect(getNextSequence).toHaveBeenCalledWith("task");
      expect(taskRepo.createTask).toHaveBeenCalledWith({
        taskId: "TSK001",
        ...taskData,
        assignedBy: admin._id,
      });
      expect(result.taskId).toBe("TSK001");

    });

    test("should reject creation without an authenticated actor", async () => {
      await expect(TaskService.addTask({ title: "Task" })).rejects.toMatchObject({
        statusCode: 401,
      });
      expect(taskRepo.createTask).not.toHaveBeenCalled();
      expect(getNextSequence).not.toHaveBeenCalled();
    });

  });

  describe("getAllTasks", () => {

    test("should return all tasks", async () => {

      const tasks = [{ title: "Task1" }];

      taskRepo.findAllActive.mockResolvedValue(tasks);

      const result = await TaskService.getAllTasks(admin);

      expect(taskRepo.findAllActive).toHaveBeenCalledWith({});
      expect(result).toEqual(tasks);

    });

    test("should scope employee reads to the authenticated assignee", async () => {
      taskRepo.findAllActive.mockResolvedValue([]);

      await TaskService.getAllTasks(employee);

      expect(taskRepo.findAllActive).toHaveBeenCalledWith({
        assignedTo: employee._id,
      });
    });

    test("should reject reads without an authenticated actor", async () => {
      await expect(TaskService.getAllTasks()).rejects.toMatchObject({
        statusCode: 401,
      });
      expect(taskRepo.findAllActive).not.toHaveBeenCalled();
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

      const result = await TaskService.getTaskById("TSK001", admin);

      expect(result).toEqual(task);
      expect(taskRepo.findActiveByTaskId).toHaveBeenCalledWith("TSK001", {});

    });

    test("should throw error if task not found", async () => {

      taskRepo.findActiveByTaskId.mockResolvedValue(null);

      await expect(
        TaskService.getTaskById("TSK001", admin)
      ).rejects.toThrow(AppError);

    });

    test("should use the employee scope for detail lookups", async () => {
      taskRepo.findActiveByTaskId.mockResolvedValue({ title: "Assigned task" });

      await TaskService.getTaskById("TSK001", employee);

      expect(taskRepo.findActiveByTaskId).toHaveBeenCalledWith("TSK001", {
        assignedTo: employee._id,
      });
    });

    test("should return 404 for an out-of-scope task", async () => {
      taskRepo.findActiveByTaskId.mockResolvedValue(null);

      await expect(
        TaskService.getTaskById("TSK002", employee),
      ).rejects.toMatchObject({ statusCode: 404, message: "No task found" });
    });

    test("should reject detail reads without an authenticated actor", async () => {
      await expect(TaskService.getTaskById("TSK001")).rejects.toMatchObject({
        statusCode: 401,
      });
      expect(taskRepo.findActiveByTaskId).not.toHaveBeenCalled();
    });

  });

  describe("updateTask", () => {

    test("should update task successfully", async () => {

      const mockTask = {
        title: "Old title"
      };

      taskRepo.findActiveByTaskId.mockResolvedValue(mockTask);
      taskRepo.updateIfCurrent.mockResolvedValue({ title: "New title" });

      const updatedData = {
        title: "New title"
      };

      const result = await TaskService.updateTask("TSK001", updatedData, admin);

      expect(mockTask.title).toBe("Old title");
      expect(taskRepo.updateIfCurrent).toHaveBeenCalledWith(mockTask, {}, { title: "New title" });
      expect(result).toEqual({ title: "New title" });

    });

    test("should throw error if task not found", async () => {

      taskRepo.findActiveByTaskId.mockResolvedValue(null);

      await expect(
        TaskService.updateTask("TSK001", {}, admin)
      ).rejects.toThrow(AppError);

    });

    test("Employee status permission does not authorize the Admin editor", async () => {
      await expect(TaskService.updateTask("TSK001", { status: "in-progress" }, employee))
        .rejects.toMatchObject({ statusCode: 403 });
      expect(taskRepo.updateIfCurrent).not.toHaveBeenCalled();
    });

    test("conflicting Admin edits require refresh instead of overwriting a newer task", async () => {
      const task = { taskId: "TSK001", title: "Old title", status: "pending" };
      taskRepo.findActiveByTaskId.mockResolvedValue(task);
      taskRepo.updateIfCurrent.mockResolvedValue(null);
      await expect(TaskService.updateTask("TSK001", { title: "New title" }, admin))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(task.title).toBe("Old title");
    });

  });

  describe("updateTaskStatus", () => {
    const pending = { taskId: "TSK001", assignedTo: employee._id, status: "pending" };

    test("updates the assigned task with a scoped conditional write", async () => {
      taskRepo.findActiveByTaskId.mockResolvedValue(pending);
      taskRepo.updateIfCurrent.mockResolvedValue({ ...pending, status: "in-progress" });
      const result = await TaskService.updateTaskStatus("TSK001", { status: "in-progress" }, employee);
      expect(result.status).toBe("in-progress");
      expect(taskRepo.findActiveByTaskId).toHaveBeenCalledWith("TSK001", { assignedTo: employee._id });
      expect(taskRepo.updateIfCurrent).toHaveBeenCalledWith(pending, { assignedTo: employee._id }, { status: "in-progress" });
    });

    test("rejects a crafted body before any write", async () => {
      await expect(TaskService.updateTaskStatus("TSK001", { status: "in-progress", title: "Changed" }, employee))
        .rejects.toMatchObject({ statusCode: 403 });
      expect(taskRepo.findActiveByTaskId).not.toHaveBeenCalled();
      expect(taskRepo.updateIfCurrent).not.toHaveBeenCalled();
    });

    test("rejects a direct pending-to-done transition", async () => {
      taskRepo.findActiveByTaskId.mockResolvedValue(pending);
      await expect(TaskService.updateTaskStatus("TSK001", { status: "done" }, employee))
        .rejects.toMatchObject({ statusCode: 400 });
      expect(taskRepo.updateIfCurrent).not.toHaveBeenCalled();
    });

    test("same-status retries do not write or change timestamps", async () => {
      taskRepo.findActiveByTaskId.mockResolvedValue(pending);
      expect(await TaskService.updateTaskStatus("TSK001", { status: "pending" }, employee)).toBe(pending);
      expect(taskRepo.updateIfCurrent).not.toHaveBeenCalled();
    });

    test("rechecks assignment after a lost conditional write", async () => {
      taskRepo.findActiveByTaskId.mockResolvedValueOnce(pending).mockResolvedValueOnce(null);
      taskRepo.updateIfCurrent.mockResolvedValue(null);
      await expect(TaskService.updateTaskStatus("TSK001", { status: "in-progress" }, employee))
        .rejects.toMatchObject({ statusCode: 404 });
      expect(taskRepo.findActiveByTaskId).toHaveBeenNthCalledWith(2, "TSK001", { assignedTo: employee._id });
    });

    test("a different winning status returns a conflict without another write", async () => {
      taskRepo.findActiveByTaskId.mockResolvedValueOnce(pending).mockResolvedValueOnce({ ...pending, status: "done" });
      taskRepo.updateIfCurrent.mockResolvedValue(null);
      await expect(TaskService.updateTaskStatus("TSK001", { status: "in-progress" }, employee))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(taskRepo.updateIfCurrent).toHaveBeenCalledTimes(1);
    });

    test("a duplicate winner is returned only after a fresh authorized lookup", async () => {
      const started = { ...pending, status: "in-progress" };
      taskRepo.findActiveByTaskId.mockResolvedValueOnce(pending).mockResolvedValueOnce(started);
      taskRepo.updateIfCurrent.mockResolvedValue(null);
      expect(await TaskService.updateTaskStatus("TSK001", { status: "in-progress" }, employee)).toBe(started);
      expect(taskRepo.updateIfCurrent).toHaveBeenCalledTimes(1);
    });

    test("requires an authenticated actor", async () => {
      await expect(TaskService.updateTaskStatus("TSK001", { status: "in-progress" }))
        .rejects.toMatchObject({ statusCode: 401 });
      expect(taskRepo.updateIfCurrent).not.toHaveBeenCalled();
    });
  });

});
