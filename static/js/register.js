
$('#f').submit(function(e){
    e.preventDefault();
    var value = $('#m').val()
    var password = $('#p').val()
    $.ajax({
        url: 'register/',
        type: "POST",
        data: {name : value,
            password : password
        },

        success: function(data){
            window.location.href = data;

        },
        error : function (data) {
            console.log(data)
        }
    })


});