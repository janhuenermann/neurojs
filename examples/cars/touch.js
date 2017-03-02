/* quickhack from http://stackoverflow.com/a/1781750 */

function touchHandler(event) {
    var touches = event.changedTouches, first = touches[0], type = "";
    switch(event.type) {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type = "mousemove"; break;
        case "touchend":   type = "mouseup";   break;
        default:           return;
    }

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
                                  first.screenX, first.screenY,
                                  first.clientX, first.clientY, false,
                                  false, false, false, 0/*left*/, null);
    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

container.addEventListener("touchstart", touchHandler, true);
container.addEventListener("touchmove", touchHandler, true);
container.addEventListener("touchend", touchHandler, true);
container.addEventListener("touchcancel", touchHandler, true);
