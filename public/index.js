jQuery(document).ready(
    function () {
        $('input:file').change(
            function () {
                $("#infocontainer").empty();
                $('input:submit').attr('disabled', true);
                if ($(this).val()) {
                    $('input:submit').attr('disabled', false);
                }
                if ($(this).val() == "") {
                    $('input:submit').attr('disabled', true);
                }
            }
        );
    });
$(document).ready(function () {
    $('#uploadForm').submit(function () {
        var fullPath = document.getElementById('upload').value;
        if (fullPath) {
            var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') :
                fullPath.lastIndexOf('/'));
            var filename = fullPath.substring(startIndex);
            if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
                filename = filename.substring(1);
            }
        }
        $('input:submit').attr('disabled', true);
        var divelement = document.createElement('div');
        var closebuttonelement = document.createElement('spanelement');
        var statuselement = document.createElement('spanelement');
        $("#infocontainer").empty();
        $("#infocontainer").append($(divelement).addClass("info").append($(closebuttonelement).addClass("closebtn").attr("onclick", '$( "#infocontainer" ).empty();').text("x")).append($(statuselement).attr("id", "status")));
        $("#status").empty().text("File is uploading...");
        $(this).ajaxSubmit({
            error: function (xhr) {
                var divelement = document.createElement('div');
                var closebuttonelement = document.createElement('spanelement');
                var statuselement = document.createElement('spanelement');
                $("#infocontainer").empty();
                $("#infocontainer").append($(divelement).addClass("alert").append($(closebuttonelement).addClass("closebtn").attr("onclick", '$( "#infocontainer" ).empty();').text("x")).append($(statuselement).attr("id", "status")));
                $("#status").empty().text(xhr.status + ": " + xhr.statusText + ": " + xhr.responseText);
            },
            success: function (response) {
                $("#status").empty().text(filename + " converted with success!");
                $('input:submit').attr('disabled', false);


                var a = document.createElement('a');
                a.style = "display: none";
                var blob = new Blob([response]);
                var url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = filename + "_with_di.xml";
                document.body.appendChild(a);
                a.click();
                setTimeout(function(){
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
                $('input:file').val('');
                $('input:submit').attr('disabled', true);
            }
        });
        return false;
    });
});