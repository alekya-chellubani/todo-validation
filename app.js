const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3009, () => {
      console.log("server running at http://localhost:3009");
    });
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`);
    process.exit(1);
  }
};
initializeDBServer();

//validating table fields

const validatePriority = (priority) => {
  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
    return true;
  }
  return false;
};
const validateStatus = (status) => {
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    return true;
  }
  return false;
};
const validateCategory = (category) => {
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    return true;
  }
  return false;
};
const validateDuedate = (dueDate) => {
  const date = format(new Date(dueDate), "yyyy-MM-dd");
  if (dueDate === date) {
    return true;
  }
  return false;
};

////GET API scenarios

const checkScenario1 = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const checkScenario2 = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const checkScenario3 = (requestQuery) => {
  return requestQuery.status !== undefined && requestQuery.status !== undefined;
};
const checkScenario4 = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const checkScenario5 = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const checkScenario6 = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const checkScenario7 = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// GET API
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let data = null;
  let getDataQuery = "";
  let queryCol = null;
  switch (true) {
    case checkScenario1(request.query):
      getDataQuery = `
                    SELECT
                    *
                    FROM
                    todo 
                    WHERE
                    status = '${status}';`;
      queryCol = "status";
      break;
    case checkScenario2(request.query):
      getDataQuery = `
                SELECT 
                * 
                FROM
                todo
                WHERE  
                priority = '${priority}';`;
      queryCol = "priority";
      break;
    case checkScenario3(request.query):
      getDataQuery = `
                SELECT 
                * 
                FROM 
                todo
                WHERE priority = '${priority}' AND status = '${status}';`;
      queryCol = "priority and status";
      break;
    case checkScenario4(request.query):
      getDataQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      queryCol = "todo";
      break;
    case checkScenario5(request.query):
      getDataQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
      queryCol = "category and status";
      break;
    case checkScenario6(request.query):
      getDataQuery = `SELECT * FROM todo WHERE category = '${category}';`;
      queryCol = "Category";
      break;
    case checkScenario7(request.query):
      getDataQuery = `SELECT * FROM todo WHERE  category = '${category}' AND priority = '${priority}';`;
      queryCol = "category and priority";
      break;
    default:
      getDataQuery = `
                SELECT
                *
                FROM
                todo`;
  }
  data = await db.all(getDataQuery);
  console.log(data);
  if (data.length === 0) {
    response.status(400);
    response.send(`Invalid Todo ${queryCol}`);
  } else {
    response.send(data);
  }
});
//specific id API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
        *
        FROM
        todo
        WHERE
        id='${todoId}';`;
  const todoItem = await db.get(getTodoQuery);
  response.send(todoItem);
});

// GET date:
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(date);
  if (validateDuedate(date) === true) {
    console.log(dueDate);
    const getTodoQuery = `
        SELECT 
        *
        FROM
        todo
        WHERE
        due_date = '${dueDate}';`;
    const todoItemList = await db.all(getTodoQuery);
    response.send(todoItemList);
  } else {
    response.status(400);
    response.send(`Invalid Due Date`);
  }
});

// POST todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const p = validatePriority(priority);
  const s = validateStatus(status);
  const c = validateCategory(category);
  const d = validateDuedate(dueDate);
  console.log(p, s, c, d);
  if (p === true && s === true && c === true && d === true) {
    const postTodoQuery = `
            INSERT INTO todo (id, todo, priority, status, category, due_date) VALUES 
            ('${id}', '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    let col = "";
    response.status(400);
    if (p === false) {
      col = "Todo Priority";
    }
    if (s === false) {
      col = "Todo Status";
    }
    if (c === false) {
      col = "Todo Category";
    }
    if (d === false) {
      col = "Due Date";
    }
    response.send(`Invalid ${col}`);
  }
});

const updateStatus = (requestBody) => {
  return;
  requestBody.status !== undefined;
};
const updatePriority = (requestBody) => {
  return;
  requestBody.priority !== undefined;
};
const updateTodo = (requestBody) => {
  return;
  requestBody.todo !== undefined;
};
const updateCategory = (requestBody) => {
  return;
  requestBody.category !== undefined;
};
const updateDuedate = (requestBody) => {
  return;
  requestBody.dueDate !== undefined;
};
// PUT todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let validCol = "";
  const requestBody = request.body;
  let valid = false;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Todo Status";
      validCol = "Status";
      valid = validateStatus(requestBody.status);
      console.log(valid);
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Todo Priority";
      validCol = "Priority";
      valid = validatePriority(requestBody.priority);
      break;
    case requestBody.todo !== undefined:
      validCol = "Todo";
      valid = true;
      break;
    case requestBody.category !== undefined:
      updateColumn = "Todo Category";
      validCol = "Category";
      valid = validateCategory(requestBody.category);

      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      validCol = "Due Date";
      valid = validateDuedate(requestBody.dueDate);

      break;
    default:
      updateCategory = "";
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  console.log(todo, priority, status, category, dueDate);
  if (valid === true) {
    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='%${dueDate}'
    WHERE
      id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${validCol} Updated`);
  } else {
    response.status(400);
    response.send(`Invalid ${updateColumn}`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
