$(function () {
    // Get the last updated timestamp
    var getLastUpdatedTime = function () {
        $.get('/last-updated', function (data) {
            if (!data) {
                setTimeout(getLastUpdatedTime, 1000);
            } else {
                $('#last-updated-time').html(data);
            }
        });
    };

    getLastUpdatedTime();
});

