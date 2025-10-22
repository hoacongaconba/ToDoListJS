// API URL
const API_URL = "https://686954112af1d945cea19cf5.mockapi.io/tasks";

// DOM Elements
const todoInput = document.getElementById("todo-input");
const addButton = document.getElementById("add-button");
const todoList = document.getElementById("todo-list");
const editModal = document.getElementById("edit-modal");
const closeModal = document.querySelector(".close");
const editInput = document.getElementById("edit-input");
const saveEditButton = document.getElementById("save-edit");
let currentTodoId = null;

// Load todos when page loads
document.addEventListener("DOMContentLoaded", getTodos);

// Event listeners
addButton.addEventListener("click", addTodo);
todoInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTodo();
});
closeModal.addEventListener("click", () => (editModal.style.display = "none"));
saveEditButton.addEventListener("click", saveEdit);
window.onclick = (e) => {
  if (e.target === editModal) editModal.style.display = "none";
};

// Get all todos
async function getTodos() {
  showLoader();
  try {
    const response = await axios.get(API_URL);
    displayTodos(response.data);
  } catch (err) {
    showError("Failed to load todos");
    console.error(err);
  } finally {
    hideLoader();
  }
}

// Add a new todo
async function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  const newTodo = {
    content: text,
    isComplete: false,
    createdAt: new Date().toISOString(),
  };

  showLoader();
  try {
    const response = await axios.post(API_URL, newTodo);
    addTodoToList(response.data);
    todoInput.value = "";
    showSuccess("Task added successfully!");
  } catch (err) {
    showError("Failed to add todo");
    console.error(err);
  } finally {
    hideLoader();
  }
}

// Toggle todo status
async function toggleStatus(id, isComplete) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, { isComplete });
    updateTodoItem(response.data);
    showSuccess(isComplete ? "Task completed!" : "Task marked as active");
  } catch (err) {
    showError("Failed to update todo status");
    console.error(err);
  }
}

// Open edit modal
function openEdit(id, content) {
  currentTodoId = id;
  editInput.value = content;
  editModal.style.display = "block";
  editInput.focus();
}

// Save edited todo
async function saveEdit() {
  if (!currentTodoId) return;

  const text = editInput.value.trim();
  if (!text) return;

  showLoader();
  try {
    const response = await axios.put(`${API_URL}/${currentTodoId}`, {
      content: text,
    });
    updateTodoItem(response.data);
    editModal.style.display = "none";
    showSuccess("Task updated successfully!");
  } catch (err) {
    showError("Failed to update todo");
    console.error(err);
  } finally {
    hideLoader();
    currentTodoId = null;
  }
}

// Delete a todo
async function deleteTodo(id) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to recover this task!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_URL}/${id}`);
      const item = document.querySelector(`[data-id="${id}"]`);
      if (item) item.remove();

      // Show empty state if no todos left
      if (todoList.children.length === 0) {
        showEmptyState();
      }

      await Swal.fire("Deleted!", "Your task has been deleted.", "success");
    } catch (err) {
      showError("Failed to delete todo");
      console.error(err);
    }
  }
}

// Display all todos
function displayTodos(todos) {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    showEmptyState();
    return;
  }

  // Sort todos by date (newest first)
  todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  todos.forEach((todo) => {
    addTodoToList(todo);
  });
}

// Add a todo to the list
function addTodoToList(todo) {
  // Remove empty state if exists
  const emptyState = document.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

  const li = document.createElement("li");
  li.className = `todo-item ${todo.isComplete ? "completed" : ""}`;
  li.dataset.id = todo.id;

  const date = new Date(todo.createdAt);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

  li.innerHTML = `
    <div class="todo-content">
      <input type="checkbox" class="todo-checkbox" ${
        todo.isComplete ? "checked" : ""
      }>
      <div>
        <span class="todo-text">${escapeTags(todo.content || "")}</span>
        <div class="todo-date">Created: ${formattedDate}</div>
      </div>
    </div>
    <div class="todo-actions">
      <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
      <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
    </div>
  `;

  // Add event listeners
  li.querySelector(".todo-checkbox").addEventListener("change", (e) =>
    toggleStatus(todo.id, e.target.checked)
  );

  li.querySelector(".edit-btn").addEventListener("click", () =>
    openEdit(todo.id, todo.content)
  );

  li.querySelector(".delete-btn").addEventListener("click", () =>
    deleteTodo(todo.id)
  );

  todoList.appendChild(li);
}

// Update a todo item in the list
function updateTodoItem(todo) {
  const item = document.querySelector(`[data-id="${todo.id}"]`);
  if (!item) return;

  // Update completed class
  item.className = `todo-item ${todo.isComplete ? "completed" : ""}`;

  // Update checkbox
  item.querySelector(".todo-checkbox").checked = todo.isComplete;

  // Update text
  item.querySelector(".todo-text").textContent = todo.content;
}

// Helper to show loading state
function showLoader() {
  if (document.querySelector(".loader")) return;

  const loader = document.createElement("div");
  loader.className = "loader";
  document.querySelector(".todos-container").prepend(loader);
}

// Helper to hide loading state
function hideLoader() {
  const loader = document.querySelector(".loader");
  if (loader) loader.remove();
}

// Helper to show empty state
function showEmptyState() {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.innerHTML = `
    <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 15px;"></i>
    <p>No tasks yet. Add a new task to get started!</p>
  `;
  todoList.appendChild(emptyState);
}

// Helper to escape HTML tags for security
function escapeTags(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Show success message with SweetAlert2
function showSuccess(message) {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: message,
    timer: 1500,
    showConfirmButton: false,
  });
}

// Show error message with SweetAlert2
function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  });
}
