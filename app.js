/**
 * Author: hidao80
 * License: MIT
 * Add-on name: Share with ShareGPT 
 */

// Debug print flag
const DEBUG = false;

// Suppress debug printing unless in debug mode
const console = {};
["log", "debug", "warn", "info", "error"].forEach((o => { console[o] = DEBUG ? window.console[o] : function () { }; }));

// echo Share-with-ShareGPT | md5sum
const hash = "bea37d6d1f038b8550307ed41c2c38f3";

console.debug("Share-with-ShareGPT: start");

addShareButton();

/**
 * Insert "Share" button
 * 
 * Wait for the "Regenerate response" button to be drawn.
 */
function addShareButton() {
    console.debug('Share-with-ShareGPT: update.');

    // If you have an avatar and only one button and no share button
    const shareButton = document.createElement('button');

    // To avoid name conflicts with other extensions
    shareButton.id = `${hash}__shareButton`;
    shareButton.className = "flex items-center justify-end btn relative btn-neutral";

    // Set the style of the button
    Object.assign(shareButton.style, {
        gap: "0.25em",
        padding: "3px 6px",
        borderRadius: "0 0 0.25rem 0.25rem",
        borderTop: "0",
    });

    const div = document.createElement('div');

    // Set the style of the button
    Object.assign(div.style, {
        position: "fixed",
        top: "0",
        right: "60px",
        zIndex: 99999,
    });

    // Drawing icons with svg
    const shape = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Set the attributes of the svg element
    const sharpAttributes = {
        "xmlns": "http://www.w3.org/2000/svg",
        "class": "h-3 w-3",
        "stroke": "currentColor",
        "fill": "none",
        "viewBox": "0 0 24 24",
        "height": "1em",
        "width": "1em",
    };
    for (const [key, value] of Object.entries(sharpAttributes)) {
        shape.setAttribute(key, value);
    }

    // Use the most commonly used design for share buttons as icons.
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Set the attributes of the svg element
    const pathAttributes = {
        "transform": "scale(1.6)",
        'd': "M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
    };
    for (const [key, value] of Object.entries(pathAttributes)) {
        path.setAttribute(key, value);
    }

    const label = document.createElement('span');
    label.textContent = browser.i18n.getMessage("Share");

    shape.appendChild(path);
    shareButton.appendChild(shape);
    shareButton.appendChild(label);
    div.appendChild(shareButton);

    // Direct placement in the body element prevents the problem of buttons not being displayed
    // due to monitoring of DOM elements or changes in DOM layout.
    document.body.appendChild(div);

    /**
     * Processing at share button click event
     */
    document.getElementById(`${hash}__shareButton`)?.addEventListener('click', clickShareButton);
}

/**
 * Share button click event handler
 * 
 * The chat content is sent to the ShareGPT URL.
 * The thread to be shared will be opened in a new tab.
 * @param {Event} event
 * @returns {void}
 */
function clickShareButton(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    const threadContainer = document.querySelector("main div > div > div > div");
    if (threadContainer.children.length <= 1) {
        // If there is no chat content, the process is interrupted with a message.
        alert(browser.i18n.getMessage("There_is_no_chat"));
        return;
    }

    // show the model for chatgpt+ users
    let model;

    const chatGptPlusElement = document.querySelector(".gold-new-button");
    const isNotChatGptPlus =
        chatGptPlusElement && chatGptPlusElement.innerText.includes("Upgrade");

    if (!isNotChatGptPlus) {
        const modelElement = threadContainer.firstChild;
        model = modelElement.innerText;
    }

    var result;
    try {
        result = {
            title: document.title,
            avatarUrl: getAvatarImage(),
            model,
            items: [],
        };
    } catch (err) {
        return;
    }
    console.debug(result.avatarUrl);

    for (const node of threadContainer.children) {
        const content = node.querySelector(".break-words");
        const gptNode = content?.querySelector(".markdown");

        if (gptNode) {
            result.items.push({
                from: "gpt",
                value: gptNode.innerHTML,
            });
        } else if (content) {
            result.items.push({
                from: "human",
                value: content.textContent,
            });
        }
    }
    console.debug(result.items);

    // Open a confirmation dialog and share only when you agree.
    if (confirm(browser.i18n.getMessage("Do_you_really_want_to_share"))) {
        fetch("https://sharegpt.com/api/conversations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(result),
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                return false;
            })
            .then(json => {
                // Throws an exception and aborts the process 
                // if a normal return is not obtained from ShareGPT's API.
                if (!json) throw Error(Browser.i18n.getMessage("Failed_to_share"));

                console.debug(json);

                // Open the shared thread in ShareGPT in a new tab
                window.open(
                    "https://sharegpt.com/c/" + json.id,
                    "_blank"
                );
                console.debug("Share-with-ShareGPT: done.");
            })
            .catch(err => {
                alert(browser.i18n.getMessage("Failed_to_share"));
                console.error(err);
            });
    }

    console.debug('Share-with-ShareGPT: added.');
}

/**
 * Avatar image acquisition
 * 
 * To embed the user's avatar image as raw data rather than a link,
 * the avatar image is converted to base64 format and returned.
 * @returns {string} base64 encoded avatar image
 * @throws {Error} If the avatar image cannot be obtained
 */
function getAvatarImage() {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const image = document.querySelector("img.rounded-sm");

    // Set the canvas size to 30x30 pixels
    canvas.width = 30;
    canvas.height = 30;

    // Draw the img onto the canvas
    // ShareGPT reduces the avatar's canvas size because it is small.
    canvas.getContext("2d").drawImage(image, 0.4, 0.4);

    // Convert the canvase to a base64 string as a JPEG image
    const base64 = canvas.toDataURL("image/jpeg");

    return base64;
}
