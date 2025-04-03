document.addEventListener('DOMContentLoaded', () => {
    const eventNameDisplay = document.getElementById('eventName');
    const eventDateDisplay = document.getElementById('eventDate');
    const attendeeList = document.getElementById('attendeeList');
    const attendanceSummary = document.getElementById('attendanceSummary');
    const markPresentButton = document.getElementById('markPresent');
    const markAbsentButton = document.getElementById('markAbsent');
    const dateInput = document.getElementById('date');

    const eventName = "Team Meeting";
    const attendees = [
        { id: 1, name: "Arun" },
        { id: 2, name: "Beran" },
        { id: 3, name: "Zeus" },
        { id: 4, name: "Hope" },
        { id: 5, name: "Eren" },
    ];

    eventNameDisplay.textContent = eventName;

    attendees.forEach(attendee => {
        const attendeeDiv = document.createElement('div');
        attendeeDiv.className = 'attendee';
        attendeeDiv.innerHTML = `
            <span>${attendee.name}</span>
            <input type="checkbox" id="attendee-${attendee.id}" data-id="${attendee.id}">
        `;
        attendeeList.appendChild(attendeeDiv);
    });

    let attendanceData = {};
    let selectedDate = "";
    let savedAttendance = [];

    function updateAttendanceSummary() {
        attendanceSummary.innerHTML = '';
        savedAttendance.forEach(record => {
            const summaryItem = document.createElement('div');
            summaryItem.textContent = `${record.name}: ${record.status} (${record.date})`;
            attendanceSummary.appendChild(summaryItem);
        });
        for (const id in attendanceData) {
            const name = attendees.find(a => a.id == id).name;
            const status = attendanceData[id] ? "Present" : "Absent";
            const summaryItem = document.createElement('div');
            summaryItem.textContent = `${name}: ${status} (${selectedDate})`;
            attendanceSummary.appendChild(summaryItem);
        }
    }

    function saveAttendance() {
        let newAttendance = [];
        for (const id in attendanceData) {
            const name = attendees.find(a => a.id == id).name;
            const status = attendanceData[id] ? "Present" : "Absent";
            newAttendance.push({ name, status, date: selectedDate });
        }
        savedAttendance = newAttendance.concat(savedAttendance); //Add the new attendance to the top.
        attendanceData = {};
    }

    markPresentButton.addEventListener('click', () => {
        attendees.forEach(attendee => {
            const checkbox = document.getElementById(`attendee-${attendee.id}`);
            if (checkbox.checked) {
                attendanceData[attendee.id] = true;
            }
        });
        saveAttendance();
        updateAttendanceSummary();
    });

    markAbsentButton.addEventListener('click', () => {
        attendees.forEach(attendee => {
            const checkbox = document.getElementById(`attendee-${attendee.id}`);
            if (checkbox.checked) {
                attendanceData[attendee.id] = false;
            }
        });
        saveAttendance();
        updateAttendanceSummary();
    });

    dateInput.addEventListener('change', (event) => {
        selectedDate = event.target.value;
        eventDateDisplay.textContent = selectedDate;
    });

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    eventDateDisplay.textContent = today;
    selectedDate = today;
});