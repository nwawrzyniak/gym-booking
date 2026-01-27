// Complete booking modal functions
function completeBooking(bookingId) {
  document.getElementById('bookingId').value = bookingId;
  document.getElementById('completeModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('completeModal').style.display = 'none';
}

// Handle complete booking form submission
const completeForm = document.getElementById('completeForm');
if (completeForm) {
  completeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookingId = document.getElementById('bookingId').value;
    const duration = document.getElementById('duration').value;
    const distance = document.getElementById('distance').value;

    const response = await fetch(`/complete-booking/${bookingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration,
        distance
      })
    });

    if (response.ok) {
      location.reload();
    }
  });
}
