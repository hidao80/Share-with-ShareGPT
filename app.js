const IS_DEBUG_MODE = false;
IS_DEBUG_MODE && console.debug("Share-with-ShareGPT: start");

// echo Share-with-ShareGPT | md5sum
const hash = "bea37d6d1f038b8550307ed41c2c38f3";
const observer = new MutationObserver(addButton);

const timer = setInterval(() => {
    IS_DEBUG_MODE && console.debug('Share-with-ShareGPT: watch.');
    const watchTarget = document.querySelector("#__next");
    if (watchTarget) {
        clearInterval(timer);
        addButton();
        observer.observe(watchTarget, { subtree: true, childList: true });
    }
}, 300);

// Wait for the "Regenerate response" button to be drawn.
function addButton() {
    IS_DEBUG_MODE && console.debug('Share-with-ShareGPT: update.');

    // Wait for the system buttons to be drawn.
    if (document.querySelector("img.rounded-sm")
    && document.querySelectorAll(`form > div > div:nth-child(1) > button`).length == 1
    && document.querySelector(`#${hash}__shareButton`) == null) {
        const shareButton = document.createElement('button');
        shareButton.id = `${hash}__shareButton`;
        shareButton.className = "btn relative btn-neutral border-2 md:border order-2";
        const div = document.createElement('div');
        div.className = "flex w-full items-center justify-center gap-2";

        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        shape.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        shape.setAttribute("class", "h-3 w-3");
        shape.setAttribute("stroke", "currentColor");
        shape.setAttribute("fill", "none");
        shape.setAttribute("viewBox", "0 0 17 17");
        shape.setAttribute("height", "1em");
        shape.setAttribute("width", "1em");

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', "M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z");

        const label = document.createElement('span');
        label.textContent = browser.i18n.getMessage("Share");

        shape.appendChild(path);
        div.appendChild(shape);
        div.appendChild(label);
        shareButton.appendChild(div);

        const formButtonArea = document.querySelector("form > div > div:nth-child(1)");
        // formButtonArea.innerHTML += shareButton;
        formButtonArea.appendChild(shareButton);

        document.querySelector(`#${hash}__shareButton`)?.addEventListener('click', (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation();

            const threadContainer = document.querySelector("#__next main div:nth-of-type(1) div:nth-of-type(1) div:nth-of-type(1) div:nth-of-type(1)");

            var result = {
                avatarUrl: getAvatarImage(),
                items: [],
            };
            IS_DEBUG_MODE && console.debug(result.avatarUrl);

            for (const node of threadContainer.children) {
                const markdonwContent = node.querySelector(".markdown");

                // tailwind class indicates human or gpt
                if ([...node.classList].includes("dark:bg-gray-800")) {
                    result.items.push({
                        from: "human",
                        value: node.textContent,
                    });
                    // if it's a GPT response, it might contein code blocks
                    // Supports dark mode
                } else if ([...node.classList].includes("dark:bg-gray-50") || [...node.classList].includes("dark:bg-[#444654]")) {
                    result.items.push({
                        from: "gpt",
                        value: markdonwContent.outerHTML,
                    });
                }
            }

            if (confirm(browser.i18n.getMessage("Do_you_really_want_to_share"))) {
                fetch("https://sharegpt.com/api/save", {
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
                        if (!json) throw Error(Browser.i18n.getMessage("Failed_to_share"));
                        IS_DEBUG_MODE && console.debug(json);
                        window.open(
                            "https://sharegpt.com/c/" + json.id,
                            "_blank"
                        );
                        IS_DEBUG_MODE && console.debug("Share-with-ShareGPT: done.");
                    })
                    .catch(err => {
                        alart(browser.i18n.getMessage("Failed_to_share"));
                        IS_DEBUG_MODE && console.error(err);
                    })
            }

            IS_DEBUG_MODE && console.debug('Share-with-ShareGPT: added.');
        });
        // When you delete a chat and come back to a new chat
        // Delete the share button as it will remain.
    } else if (!(document.querySelector("img.rounded-sm"))
    && document.querySelectorAll(`form > div > div:nth-child(1) > button`).length == 1
    && document.querySelector(`#${hash}__shareButton`) != null) {
        document.querySelector(`#${hash}__shareButton`).remove();
    }
}

function getAvatarImage() {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const image = document.querySelector("img.rounded-sm");

    // Set the canvas size to 30x30 pixels
    canvas.width = 30;
    canvas.height = 30;

    // Draw the img onto the canvas
    canvas.getContext("2d").drawImage(image, 0, 0);

    // Convert the canvase to a base64 string as a JPEG image
    const base64 = canvas.toDataURL("image/jpeg");

    return base64;
}
