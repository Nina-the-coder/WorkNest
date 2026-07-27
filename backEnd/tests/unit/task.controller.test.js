const TaskController = require("../../src/modules/task/task.controller");
const TaskService = require("../../src/modules/task/task.service");

jest.mock("../../src/modules/task/task.service");

describe("Task Controller", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("addTask should create task", async () => {

    const req = {
      body: { title: "New Task" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    TaskService.addTask.mockResolvedValue({ title: "New Task" });

    await TaskController.addTask(req, res);

    expect(TaskService.addTask).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);

  });

  test("getAllTasks should return tasks", async () => {

    const req = {};

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const tasks = [{ title: "Task1" }];

    TaskService.getAllTasks.mockResolvedValue(tasks);

    await TaskController.getAllTasks(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(tasks);

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
      req.body
    );

    expect(res.status).toHaveBeenCalledWith(200);

  });

});