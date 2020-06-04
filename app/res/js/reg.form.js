window.addEventListener('load', function(){
    window.$domain = window.location.protocol+'//'+window.location.host;
    var preLoadedAvatars = [];
    var avatarImages = document.getElementById('_dp').querySelectorAll('option');
    [].forEach.call(avatarImages, function(el){
        var img = new Image(64, 64);
        img.src = 'res/avs/'+el.value;
        preLoadedAvatars.push(img)
    })
    document.getElementById('_dp').addEventListener('change', function(evt){
        this.nextElementSibling.src = 'res/avs/'+this.children[this.selectedIndex].value;
        document.getElementById('_dp_char').value = this.children[this.selectedIndex].value;
    })
    document.getElementById('-signup').querySelector('#submit').onclick = function(e){
        var user = {
            name : document.getElementById('_name').value,
            id : document.getElementById('_email').value,
            pass : document.getElementById('_pass').value,
            dp : document.getElementById('_dp_char').value
        }
        var f = new FormData();
        for(var key in user){
            f.append(key, user[key]);
        }
        var xhr = new XMLHttpRequest();
        xhr.open('POST', window.$domain+'/signup');
        xhr.send(f);
        document.getElementById('page-content').innerHTML = 'Loading ...'
        xhr.onreadystatechange = function(){
            if(this.readyState == 4){
                document.getElementById('page-content').innerHTML = this.response;
            }
        }
    }
})