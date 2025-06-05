// Popup script
console.log("Popup script loaded.");

document.addEventListener('DOMContentLoaded', function() {
  const queryInput = document.getElementById('queryInput');
  const submitButton = document.getElementById('submitQuery');
  const statusDiv = document.getElementById('status');

  submitButton.addEventListener('click', function() {
    const query = queryInput.value.trim();
    if (query) {
      statusDiv.textContent = 'Processing...';
      chrome.runtime.sendMessage({ type: "USER_QUERY", query: query }, response => {
        if (chrome.runtime.lastError) {
          console.error("Error sending query:", chrome.runtime.lastError.message);
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }

        console.log("Background script responded to query:", response);
        if (response && response.plan) {
          statusDiv.textContent = `Action: ${response.plan.action}, Target ID: ${response.plan['assistant-id']}`;
          if(response.plan.value) {
            statusDiv.textContent += `, Value: ${response.plan.value}`;
          }
          // Here you would typically send the plan to the content script for execution
          // For now, just displaying it in the popup.
        } else if (response && response.error) {
          statusDiv.textContent = 'Error: ' + response.error;
        } else {
           statusDiv.textContent = 'Received unexpected response.';
        }
      });
    } else {
      statusDiv.textContent = 'Please enter a query.';
    }
  });

  queryInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      submitButton.click();
    }
  });
});
