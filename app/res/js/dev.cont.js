window.addEventListener('load', function(){
    window.$domain = window.location.protocol+'//'+window.location.host;
    function succ(){
        document.getElementById('feed').innerHTML = `<span class= 'succ'>Your reply was sent successfully</span>`
    };
    function err(){
        document.getElementById('feed').innerHTML = `<span class= 'err'>Your response wasn't received. Please try again.</span>`
    }
    document.getElementById('_smsg').addEventListener('click', function(e){
        e.preventDefault();
        var _email = document.getElementById('_em_').value;
        var _msg = document.getElementById('_msg_').value; 
        var _sbBtn = document.getElementById('_smsg');
        if (_email && _msg.length >= 20){
            var xhr = new XMLHttpRequest();
            var formData = new FormData();
            formData.append('email', _email);
            formData.append('name', document.getElementById('_nm_').value || 'Anonymous');
            formData.append('msg', _msg);
            xhr.open('POST', window.$domain+'/feedback');
            xhr.send(formData);
            e.target.classList.add('_loader')
            xhr.onreadystatechange = function(){
                xhr.readyState == 4 ? succ() : err()
            }
        }
    })
})