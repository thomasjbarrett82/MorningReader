class DragDropManager {
  constructor(listContainerId, onReorderCallback) {
    this.listContainer = document.getElementById(listContainerId);
    this.onReorderCallback = onReorderCallback;
    this.draggedElement = null;
    this.draggedIndex = null;

    if (!this.listContainer) {
      console.error(`Container with id "${listContainerId}" not found`);
      return;
    }

    this.init();
  }

  init() {
    this.updateDraggableItems();
  }

  updateDraggableItems() {
    const items = this.listContainer.querySelectorAll(".list-group-item");

    items.forEach((item, index) => {
      item.setAttribute("draggable", "true");
      item.dataset.index = index;

      // Add drag handle if not already present
      if (!item.querySelector(".drag-handle")) {
        const dragHandle = document.createElement("span");
        dragHandle.className = "drag-handle float-start";
        dragHandle.innerHTML = '<i class="bi bi-grip-vertical"></i>';
        dragHandle.title = "Drag to reorder";

        // Insert at the beginning of the item
        const firstSpan = item.querySelector("span.d-inline-block");
        if (firstSpan) {
          item.insertBefore(dragHandle, firstSpan);
        } else {
          item.insertBefore(dragHandle, item.firstChild);
        }
      }

      // Remove existing listeners to prevent duplicates
      item.removeEventListener("dragstart", this.handleDragStart);
      item.removeEventListener("dragover", this.handleDragOver);
      item.removeEventListener("drop", this.handleDrop);
      item.removeEventListener("dragend", this.handleDragEnd);
      item.removeEventListener("dragenter", this.handleDragEnter);
      item.removeEventListener("dragleave", this.handleDragLeave);

      // Add event listeners
      item.addEventListener("dragstart", this.handleDragStart.bind(this));
      item.addEventListener("dragover", this.handleDragOver.bind(this));
      item.addEventListener("drop", this.handleDrop.bind(this));
      item.addEventListener("dragend", this.handleDragEnd.bind(this));
      item.addEventListener("dragenter", this.handleDragEnter.bind(this));
      item.addEventListener("dragleave", this.handleDragLeave.bind(this));
    });
  }

  handleDragStart(e) {
    this.draggedElement = e.currentTarget;
    this.draggedIndex = parseInt(this.draggedElement.dataset.index);

    // Set drag data
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.draggedElement.innerHTML);

    // Add dragging class for visual feedback
    this.draggedElement.classList.add("dragging");

    // Make element slightly transparent while dragging
    setTimeout(() => {
      this.draggedElement.style.opacity = "0.5";
    }, 0);
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    e.dataTransfer.dropEffect = "move";
    return false;
  }

  handleDragEnter(e) {
    const target = e.currentTarget;
    if (target !== this.draggedElement) {
      target.classList.add("drag-over");
    }
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const dropTarget = e.currentTarget;

    // Don't do anything if dropping on the same item
    if (this.draggedElement !== dropTarget) {
      const dropIndex = parseInt(dropTarget.dataset.index);

      // Reorder the DOM elements
      if (this.draggedIndex < dropIndex) {
        // Moving down - insert after
        dropTarget.parentNode.insertBefore(
          this.draggedElement,
          dropTarget.nextSibling,
        );
      } else {
        // Moving up - insert before
        dropTarget.parentNode.insertBefore(this.draggedElement, dropTarget);
      }

      // Call the callback function to update the data model
      if (this.onReorderCallback) {
        this.onReorderCallback(this.draggedIndex, dropIndex);
      }

      // Update indices
      this.updateDraggableItems();
    }

    dropTarget.classList.remove("drag-over");
    return false;
  }

  handleDragEnd(e) {
    // Reset opacity
    this.draggedElement.style.opacity = "1";
    this.draggedElement.classList.remove("dragging");

    // Remove all drag-over classes
    const items = this.listContainer.querySelectorAll(".list-group-item");
    items.forEach((item) => {
      item.classList.remove("drag-over");
    });

    this.draggedElement = null;
    this.draggedIndex = null;
  }

  // Public method to refresh draggable items after the list changes
  refresh() {
    this.updateDraggableItems();
  }

  // Public method to destroy the drag-and-drop functionality
  destroy() {
    const items = this.listContainer.querySelectorAll(".list-group-item");
    items.forEach((item) => {
      item.removeAttribute("draggable");
      item.removeEventListener("dragstart", this.handleDragStart);
      item.removeEventListener("dragover", this.handleDragOver);
      item.removeEventListener("drop", this.handleDrop);
      item.removeEventListener("dragend", this.handleDragEnd);
      item.removeEventListener("dragenter", this.handleDragEnter);
      item.removeEventListener("dragleave", this.handleDragLeave);

      // Remove drag handle
      const dragHandle = item.querySelector(".drag-handle");
      if (dragHandle) {
        dragHandle.remove();
      }
    });
  }
}
