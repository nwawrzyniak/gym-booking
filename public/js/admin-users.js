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

// Close modal when clicking outside of it
window.onclick = function(event) {
  const confirmModal = document.getElementById('confirmModal');
  if (event.target === confirmModal) {
    closeConfirmModal();
  }
};
