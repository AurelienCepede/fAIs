// Background script for the AI Web Assistant
console.log("AI Web Assistant background script loaded.");

let currentDomElements = []; // Store DOM elements for later use

// Basic NLP and action determination function
function processQuery(query, domElements) {
  console.log(`Processing query: "${query}" with ${domElements.length} DOM elements.`);
  const lowerQuery = query.toLowerCase();
  let action = null;
  let targetElement = null;

  // Very basic action extraction (default to "click")
  if (lowerQuery.startsWith("click") || lowerQuery.includes("press") || lowerQuery.includes("select")) {
    action = "click";
  } else if (lowerQuery.startsWith("fill") || lowerQuery.startsWith("type") || lowerQuery.startsWith("enter")) {
    action = "fill";
  }
  // Add more actions as needed (e.g., "navigate", "scroll")

  if (!action) {
    console.log("Could not determine action from query:", query);
    return null; // Or default to a common action if appropriate
  }

  // Attempt to extract target description (e.g., "button with text 'Login'")
  // This is highly simplified. A real implementation would use more robust parsing.
  const parts = lowerQuery.split(" ");
  let bestMatch = null;
  let highestScore = 0;

  // Try to find element by exact text match first (if query contains quotes)
  const quotedTextMatch = query.match(/'([^']+)'/);
  if (quotedTextMatch && quotedTextMatch[1]) {
    const textToMatch = quotedTextMatch[1].toLowerCase();
    for (const el of domElements) {
      if (el.text && el.text.toLowerCase().includes(textToMatch)) {
        // Prioritize elements with matching text from quotes
        targetElement = el;
        break;
      }
    }
  }

  // If no match from quoted text, try a more general search
  if (!targetElement) {
    for (const el of domElements) {
      let currentScore = 0;
      const elTextLower = el.text ? el.text.toLowerCase() : "";
      const elTagLower = el.tag ? el.tag.toLowerCase() : "";
      const elId = el.attributes && el.attributes.id ? el.attributes.id.toLowerCase() : "";
      const elClass = el.attributes && el.attributes.class ? el.attributes.class.toLowerCase() : "";
      const elAriaLabel = el.attributes && el.attributes["aria-label"] ? el.attributes["aria-label"].toLowerCase() : "";


      // Increase score for matching words from the query in element's properties
      parts.forEach(part => {
        if (part.length < 3 && !['a', 'to', 'on', 'in', 'the', 'is'].includes(part)) return; // skip short/common words unless specific
        if (elTextLower.includes(part)) currentScore += 10;
        if (elTagLower.includes(part)) currentScore += 5; // e.g., "button", "link"
        if (elId.includes(part)) currentScore += 8;
        if (elClass.includes(part)) currentScore += 3;
        if (elAriaLabel.includes(part)) currentScore += 10;
      });

      // Bonus for specific tags if mentioned
      if (lowerQuery.includes(elTagLower)) {
          currentScore += 10;
      }

      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestMatch = el;
      }
    }
    targetElement = bestMatch;
  }


  if (targetElement) {
    const result = {
      action: action,
      "assistant-id": targetElement["assistant-id"]
    };
    // If action is "fill", try to extract value
    if (action === "fill") {
      const valueMatch = query.match(/with ("([^"]*)"|'([^']*)'|(\S+))$/);
      if (valueMatch) {
        result.value = valueMatch[2] || valueMatch[3] || valueMatch[4]; // handle double quotes, single quotes, or unquoted last word
      } else {
        // If no value is found, this action might be incomplete or require clarification
        console.warn("Fill action specified but no value found in query:", query);
        // Potentially, we could ask for clarification here or make it a two-step process
        return null;
      }
    }
    console.log("Determined action:", result);
    return result;
  } else {
    console.log("Could not find target element for query:", query);
    return null;
  }
}

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);

  if (request.type === "DOM_INFO") {
    currentDomElements = request.data; // Store the latest DOM elements
    console.log(`Stored ${currentDomElements.length} DOM elements.`);
    // Potentially, trigger proactive analysis or suggestions here
    sendResponse({status: "DOM_INFO received and stored."});
  } else if (request.type === "USER_QUERY") {
    if (!currentDomElements || currentDomElements.length === 0) {
      console.warn("User query received, but no DOM elements available yet.");
      sendResponse({error: "DOM information not yet available. Please wait for the page to load fully or try again."});
      return true; // Keep 'return true' if sendResponse is called asynchronously later
    }
    const actionPlan = processQuery(request.query, currentDomElements);
    if (actionPlan) {
      // Assuming the query comes from a popup acting on the current active tab
      // Or, if the message is from a content script, sender.tab.id can be used.
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
          console.error("No active tab found to execute action.");
          sendResponse({status: "Query processing failed", error: "No active tab found."});
          return;
        }
        const activeTabId = tabs[0].id;
        executeActionOnPage(activeTabId, actionPlan, (executionResponse) => {
          // Send the execution response back to the popup
          sendResponse({status: "Action dispatched", plan: actionPlan, executionResponse: executionResponse});
        });
      });
    } else {
      sendResponse({status: "Query processing failed", error: "Could not determine action or target."});
    }
    return true; // Crucial for async response via executeActionOnPage's callback
  } else {
    sendResponse({status: "Unknown message type received"});
  }
  return true; // Indicates that the response will be sent asynchronously
});

// Example: Listen for browser action click (extension icon)
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked for tab:", tab);
  // This could open the popup or directly trigger an action
  // For instance, you could send a message to the content script
  // or open the popup.html.
});

// Example of how to send a message to content script (will be used in the next step)
// Function to send an action to the content script of a specific tab
function executeActionOnPage(tabId, actionPlan, callback) {
  chrome.tabs.sendMessage(tabId, { type: "EXECUTE_ACTION", ...actionPlan }, response => {
    if (chrome.runtime.lastError) {
      console.error("Error sending action to content script:", chrome.runtime.lastError.message);
      if (callback) callback({success: false, error: chrome.runtime.lastError.message});
    } else {
      console.log("Content script responded to action execution:", response);
      if (callback) callback(response);
    }
  });
}

console.log("AI Web Assistant background script (v2) loaded with NLP placeholder.");
