jQuery(document).ready(
    function () {
        $('input:file').change(
            function () {
                if ($(this).val()) {
                    $('input:submit').attr('disabled', false);
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
            $("#status").empty().text("File is uploading...");
            $(this).ajaxSubmit({
                error: function (xhr) {
                    console.log(xhr);
                    $("#status").empty().text(xhr.status +": "+ xhr.statusText + ": " + xhr.responseText);
                    $('input:submit').attr('disabled', false);
                },
                success: function (response) {
                    $("#status").empty().text("All done...");
                    $('input:submit').attr('disabled', false);
                    var blob = new Blob([response]);
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = filename + "_with_di.xml";
                    link.click();
                }
            });
            return false;
        });
    });