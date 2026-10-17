const TaskController = require("../../src/modules/task/task.controller");
const TaskService = require("../../src/modules/task/task.service");

jest.mock("../../src/modules/task/task.service");

describe("Task Controller", () => {
  const user = { _id: "actor-user-id", role: "admin" };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("addTask should create task", async () => {

    const req = {
      body: { title: "New Task" },
      user,
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    TaskService.addTask.mockResolvedValue({ title: "New Task" });

    await TaskController.addTask(req, res);

    expect(TaskService.addTask).toHaveBeenCalledWith(req.body, user);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Task added successfully",
      task: "New Task",
    });

  });

  test("getAllTasks should return tasks", async () => {

    const req = {
      user,
      query: { employeeId: "untrusted-user-id", assignedTo: "another-user-id" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const tasks = [{ title: "Task1" }];

    TaskService.getAllTasks.mockResolvedValue(tasks);

    await TaskController.getAllTasks(req, res);

    expect(TaskService.getAllTasks).toHaveBeenCalledWith(user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(tasks);

  });

  test("getTaskById should pass the authenticated actor and return the task", async () => {
    const req = {
      user,
      params: { taskId: "TSK001" },
      query: { employeeId: "untrusted-user-id" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const task = { taskId: "TSK001", title: "Assigned task" };
    TaskService.getTaskById.mockResolvedValue(task);

    await TaskController.getTaskById(req, res);

    expect(TaskService.getTaskById).toHaveBeenCalledWith("TSK001", user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ task });
  });

  test("deleteTask should delete task", async () => {

    const req = {
      params: { taskId: "TSK001" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    TaskService.deleteTask.mockResolvedValue();

    await TaskController.deleteTask(req, res);

    expect(TaskService.deleteTask).toHaveBeenCalledWith("TSK001");
    expect(res.status).toHaveBeenCalledWith(200);

  });

  test("updateTasks should update task", async () => {

    const req = {
      params: { taskId: "TSK001" },
      user,
      body: { title: "Updated Task" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    TaskService.updateTask.mockResolvedValue({ title: "Updated Task" });

    await TaskController.updateTasks(req, res);

    expect(TaskService.updateTask).toHaveBeenCalledWith(
      "TSK001",
      req.body,
      user,
    );

    expect(res.status).toHaveBeenCalledWith(200);

  });

  test("status action passes the trusted actor and preserves the response envelope", async () => {
    const req = { params: { taskId: "TSK001" }, body: { status: "in-progress" }, user };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const task = { taskId: "TSK001", status: "in-progress" };
    TaskService.updateTaskStatus.mockResolvedValue(task);
    await TaskController.updateTaskStatus(req, res);
    expect(TaskService.updateTaskStatus).toHaveBeenCalledWith("TSK001", req.body, user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Task status updated", task });
  });

});
