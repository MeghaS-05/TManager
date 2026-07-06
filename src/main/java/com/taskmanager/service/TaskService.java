package com.taskmanager.service;

import com.taskmanager.dto.TaskRequest;
import com.taskmanager.dto.TaskResponse;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    // Helper: get the currently logged-in user's entity from their username
    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public TaskResponse createTask(TaskRequest request, String username) {
        User user = getUserByUsername(username);

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());
        task.setUser(user);

        Task saved = taskRepository.save(task);
        return toResponse(saved);
    }

    public List<TaskResponse> getAllTasksForUser(String username) {
        User user = getUserByUsername(username);
        return taskRepository.findByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TaskResponse getTaskById(Long taskId, String username) {
        Task task = getOwnedTask(taskId, username);
        return toResponse(task);
    }

    public TaskResponse updateTask(Long taskId, TaskRequest request, String username) {
        Task task = getOwnedTask(taskId, username);

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());

        Task updated = taskRepository.save(task);
        return toResponse(updated);
    }

    public void deleteTask(Long taskId, String username) {
        Task task = getOwnedTask(taskId, username);
        taskRepository.delete(task);
    }

    // Helper: fetch a task AND verify it belongs to this user
    private Task getOwnedTask(Long taskId, String username) {
        User user = getUserByUsername(username);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Task not found with id: " + taskId);
        }

        return task;
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getDueDate()
        );
    }
}