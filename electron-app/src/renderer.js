// config
const STREAM_SPEED_MS = 30;
const FADE_OUT_DELAY_MS = 10000;
const INITIAL_FONT_SIZE = 24; // should match the font-size in #message-container
const MINIMUM_FONT_SIZE = 10; // the smallest the font can get

let fadeOutTimer;
let streamInterval;

window.api.onDisplayMessage((message) => {
    const container = document.getElementById('message-container');
    const charName = document.getElementById('char-name');
    const messageText = document.getElementById('message-text');

    if (fadeOutTimer) clearTimeout(fadeOutTimer);
    if (streamInterval) clearInterval(streamInterval);

    // reset the font size for the new message
    let currentFontSize = INITIAL_FONT_SIZE;
    container.style.fontSize = currentFontSize + 'px';

    charName.textContent = message.name + ':';
    messageText.innerHTML = '';
    container.classList.add('visible');

    const chars = message.text.split('');
    let charIndex = 0;

    streamInterval = setInterval(() => {
        if (charIndex < chars.length) {
            messageText.innerHTML += chars[charIndex];
            charIndex++;

            // (shrink to fit logic)
            // use a 'while' loop in case a single character requires multiple shrinks (e.g., a long word wrapping)
            while (
                (document.documentElement.scrollWidth > window.innerWidth || document.documentElement.scrollHeight > window.innerHeight)
                && currentFontSize > MINIMUM_FONT_SIZE
            ) {
                currentFontSize--; // shrink the font size by 1px
                container.style.fontSize = currentFontSize + 'px';
            }

        } else {
            clearInterval(streamInterval);
            fadeOutTimer = setTimeout(() => {
                container.classList.remove('visible');
            }, FADE_OUT_DELAY_MS);
        }
    }, STREAM_SPEED_MS);
});