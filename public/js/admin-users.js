let userIdToDelete = null;

function updateUserRole(userId, newRole) {
  fetch(`/api/user/${userId}/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: newRole })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error updating role');
    }
    return response.json();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Fehler beim Aktualisieren der Rolle');
    location.reload();
  });
}

function updateUserHumor(userId, humorValue) {
  const humor = humorValue === 'true';
  
  fetch(`/api/user/${userId}/humor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ humor })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error updating humor status');
    }
    return response.json();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Fehler beim Aktualisieren des Humor-Status');
    location.reload();
  });
}

function deleteUser(userId, displayName) {
  userIdToDelete = userId;
  const confirmModal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmBtn');
  
  confirmMessage.textContent = `Möchten Sie den Benutzer "${displayName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`;
  
  confirmBtn.onclick = function() {
    performDeleteUser(userId);
  };
  
  confirmModal.style.display = 'block';
}

function performDeleteUser(userId) {
  fetch(`/api/user/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error deleting user');
    }
    return response.json();
  })
  .then(() => {
    closeConfirmModal();
    const userRow = document.querySelector(`[data-user-id="${userId}"]`);
    if (userRow) {
      userRow.remove();
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Fehler beim Löschen des Benutzers');
    closeConfirmModal();
  });
}

function closeConfirmModal() {
  const confirmModal = document.getElementById('confirmModal');
  confirmModal.style.display = 'none';
  userIdToDelete = null;
}

let userIdToEdit = null;

function editUser(userId, firstName, lastName, displayName, email, humor, role) {
  userIdToEdit = userId;
  const editModal = document.getElementById('editModal');
  
  document.getElementById('editFirstName').value = firstName;
  document.getElementById('editLastName').value = lastName;
  document.getElementById('editDisplayName').value = displayName;
  document.getElementById('editEmail').value = email;
  document.getElementById('editPassword').value = '';
  document.getElementById('editHumor').value = humor.toString();
  document.getElementById('editRole').value = role;
  
  editModal.style.display = 'block';
}

function saveUserChanges() {
  if (userIdToEdit === null) return;
  
  const firstName = document.getElementById('editFirstName').value;
  const lastName = document.getElementById('editLastName').value;
  const displayName = document.getElementById('editDisplayName').value;
  const email = document.getElementById('editEmail').value;
  const password = document.getElementById('editPassword').value;
  const humor = document.getElementById('editHumor').value === 'true';
  const role = document.getElementById('editRole').value;
  
  const userData = {
    firstName,
    lastName,
    displayName,
    email,
    humor,
    role
  };
  
  if (password) {
    userData.password = password;
  }
  
  fetch(`/api/user/${userIdToEdit}/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error updating user');
    }
    return response.json();
  })
  .then(() => {
    closeEditModal();
    location.reload();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Fehler beim Aktualisieren des Benutzers');
  });
}

function closeEditModal() {
  const editModal = document.getElementById('editModal');
  editModal.style.display = 'none';
  userIdToEdit = null;
}

// Close confirmation modal when clicking outside of it
window.onclick = function(event) {
  const confirmModal = document.getElementById('confirmModal');
  if (event.target === confirmModal) {
    closeConfirmModal();
  }
};
