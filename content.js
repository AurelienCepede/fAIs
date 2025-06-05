// Content script for the AI Web Assistant
console.log("AI Web Assistant content script loaded.");

function getInteractiveElements() {
  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
  const elements = [];
  let elementIdCounter = 0;

  document.querySelectorAll('*').forEach(el => {
    if (interactiveTags.includes(el.tagName) || el.onclick || el.hasAttribute('role')) {
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') {
        return; // Skip hidden elements
      }

      // Check if element is within viewport (basic check)
      const rect = el.getBoundingClientRect();
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      // Skip elements that are too small or likely not user-interactive
      if (rect.width < 5 || rect.height < 5 && el.tagName !== 'A' && el.tagName !== 'INPUT') { // Allow small inputs/links
          return;
      }

      // More robust check for interactiveness (e.g. not disabled)
      if(el.disabled || el.getAttribute('aria-disabled') === 'true') {
          return;
      }


      let textContent = (el.innerText || el.value || el.getAttribute('aria-label') || el.title || '').trim().substring(0, 100);

      const currentAssistantId = `asst-id-${elementIdCounter++}`;
      el.setAttribute('assistant-id', currentAssistantId); // Actually set the attribute on the DOM element

      elements.push({
        "assistant-id": currentAssistantId,
        "tag": el.tagName,
        "text": textContent,
        "attributes": {
            "id": el.id,
            "class": el.className,
            "name": el.name,
            "role": el.getAttribute('role'),
            "aria-label": el.getAttribute('aria-label'),
            "placeholder": el.getAttribute('placeholder'),
            "value": el.value
        },
        "isVisible": isInViewport, // Add visibility status
        "rect": rect.toJSON() // Add bounding box info
      });
    }
  });
  return elements;
}

// Send DOM info when the page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendDomInfo);
} else {
    sendDomInfo();
}

function sendDomInfo() {
    const interactiveElements = getInteractiveElements();
    console.log("Sending DOM info to background:", interactiveElements);
    chrome.runtime.sendMessage({
        type: "DOM_INFO",
        data: interactiveElements
    }, response => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
        } else {
            console.log("Background script responded:", response);
        }
    });
}

// Listener for messages from the background script to execute actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "EXECUTE_ACTION") {
    console.log("Received action to execute:", request);
    executeAction(request, sendResponse);
    return true; // Required for asynchronous sendResponse
  }
  // NB: If you have other message types handled by content.js, ensure they are distinct
  // or that this listener doesn't interfere with the existing DOM_INFO sender if it also expected responses.
  // For now, the original sendMessage for DOM_INFO in sendDomInfo() is a one-way message or its response is handled there.
});

function executeAction(actionPlan, sendResponse) {
  const { action, "assistant-id": assistantId, value } = actionPlan;
  // The assistant-id was stored in a data structure, not directly on the DOM element in the previous version.
  // We need to re-select the element based on its properties if we didn't mark it.
  // For robust selection, the initial DOM scan should add these assistant-id attributes directly to the elements.
  // Let's assume for now that getInteractiveElements() is re-run or elements are tagged.
  // FOR THIS ITERATION: We will modify getInteractiveElements to add the attribute.

  const element = document.querySelector(`[assistant-id="${assistantId}"]`);

  if (!element) {
    console.error(`Element with assistant-id "${assistantId}" not found.`);
    sendResponse({ success: false, error: `Element with assistant-id "${assistantId}" not found.` });
    return;
  }

  try {
    switch (action) {
      case "click":
        element.focus(); // Bring element into view and focus it
        element.click();
        console.log(`Clicked element:`, element);
        sendResponse({ success: true, message: `Clicked element with assistant-id "${assistantId}"` });
        break;
      case "fill":
        if (typeof value === 'undefined') {
          console.error("Fill action called without a value for assistant-id:", assistantId);
          sendResponse({ success: false, error: "Fill action requires a value." });
          return;
        }
        if (typeof element.value === 'undefined') {
            console.error("Element does not have a value property for fill action:", element);
            sendResponse({ success: false, error: "Element cannot be filled (no value property)." });
            return;
        }
        element.focus();
        element.value = value;
        // Dispatch input event to ensure frameworks recognize the change
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true })); // for some elements that listen to change
        console.log(`Filled element:`, element, `with value: "${value}"`);
        sendResponse({ success: true, message: `Filled element with assistant-id "${assistantId}"` });
        break;
      default:
        console.warn(`Unknown action: "${action}"`);
        sendResponse({ success: false, error: `Unknown action: "${action}"` });
    }
  } catch (error) {
    console.error(`Error executing action "${action}" on element "${assistantId}":`, error);
    sendResponse({ success: false, error: `Execution failed: ${error.message}` });
  }
}

// IMPORTANT: Modify getInteractiveElements to actually set the 'assistant-id' attribute on the DOM element
// This is crucial for the querySelector in executeAction to work.

// Previous getInteractiveElements needs to be updated.
// The elements.push should also include: el.setAttribute('assistant-id', \`asst-id-\${elementIdCounter}\`);
// (Note: elementIdCounter should be part of the string construction correctly)
// So, the line would be:
// const assistantId = \`asst-id-\${elementIdCounter++}\`;
// el.setAttribute('assistant-id', assistantId);
// elements.push({ "assistant-id": assistantId, ... });
