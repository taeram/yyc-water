$(function () {
    // Get the last updated timestamp
    var getLastUpdatedTime = function () {
        $('#last-updated-time').load('/last-updated');
    };

    getLastUpdatedTime();
    setInterval(getLastUpdatedTime, 300 * 1000);
});

