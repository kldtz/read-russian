document.addEventListener('DOMContentLoaded', function () {
    var links = document.getElementsByTagName("a");
    for (let link of links) {
        (function () {
            var location = link.href;
            link.onclick = function () {
                chrome.tabs.create({active: true, url: location});
            };
        })();
    }
});