$(document).ready(function(){
    $(function () {



        $('#messages').append($('<li>').text('you joined').css('text-align', 'right'));
        var socket = io();
        $('form').submit(function(e){
            var input =  $('#m').val()
            e.preventDefault(); // prevents page reloading
            if(input.length > 0){
                socket.emit('chat message', input);
                $('#messages').append($("<li>").text(input).css('text-align', 'right'))
            }

            $('#m').val('');
            return false;
        });
        var typing = false;
        var stopped = false;
        $('#m').on('input',function(e){
            e.preventDefault(); // prevents page reloading
            socket.emit('typing',typing,stopped);
            typing = true
            stopped = false;

        });
        $('#m').change(function(e){
            e.preventDefault();// prevents page reloading
            stopped = true
            socket.emit('typing',typing,stopped);
            typing = false

        });
        socket.on('typing',function (msg) {
            $('#messages').append($('<li id='+socket.id+' >').text(msg));
        })

        socket.on('stopped',function () {
            document.getElementById(socket.id).remove()
        })


        socket.on('chat message', function(msg){
            $('#messages').append($('<li>').text(msg));
        });
        socket.on('user connected', function(msg){
            $('#messages').append($('<li>').text(msg));
        });
        socket.on('disconnect', function(msg){
            $('#messages').append($('<li>').text(msg));
        });
        var username = document.getElementById("yy").innerText;
        socket.emit('new user', username);
    })})