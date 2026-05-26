const CLOCK_FORMAT = {
    timeZone: 'Asia/Kolkata',
    timeStyle: 'long',
    hourCycle: 'h24',
};

export function initClocks(selectors = ['#clock', '#clock-2']) {
    const clockElements = selectors
        .map((selector) => document.querySelector(selector))
        .filter(Boolean);

    if (clockElements.length === 0) {
        return () => {};
    }

    const updateTime = () => {
        const formattedTime = new Date().toLocaleString('en-IN', CLOCK_FORMAT);

        clockElements.forEach((element) => {
            element.textContent = formattedTime;
        });
    };

    updateTime();

    const intervalId = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(intervalId);
}
