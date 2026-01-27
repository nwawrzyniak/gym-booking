const bookForm = document.querySelector('form[action="/book"]');
if (bookForm) {
  bookForm.addEventListener('submit', function (e) {
    const startHour = document.getElementById('startHour').value.padStart(2, '0');
    const startMinute = document.getElementById('startMinute').value.padStart(2, '0');
    const endHour = document.getElementById('endHour').value.padStart(2, '0');
    const endMinute = document.getElementById('endMinute').value.padStart(2, '0');

    document.getElementById('startTime').value = `${startHour}:${startMinute}`;
    document.getElementById('endTime').value = `${endHour}:${endMinute}`;
  });
}