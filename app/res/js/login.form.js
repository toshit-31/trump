window.addEventListener('load', function(){
    window.$domain = window.location.protocol+'//'+window.location.host;
    var err = document.getElementById('lr-msg');
    var actionId;
    document.getElementById('_user').addEventListener('input', function(){
        actionId = btoa(this.value) || '';
    })
    document.getElementById('-getin').querySelector('#submit').onclick = function(e){
        e.preventDefault();
        var f = new FormData();
        f.append('key', document.getElementById('_pass').value || '')
        var xhr = new XMLHttpRequest();
        xhr.open('POST', window.$domain+'/login/'+actionId);
        xhr.send(f);
        e.target.classList.add('_loader')
        xhr.onreadystatechange = function(){
            if(this.readyState == 4){
                var resp = this.response;
                console.log(resp)
                e.target.classList.remove('_loader')
                if(resp === '0'){
                    err.style.display = 'none'
                    setTimeout(()=>err.style.display = 'block', 500);
                    document.getElementById('_pass').value = ''
                } else if(resp === '1') {
                    err.innerHTML = 'There was some server error. Please try again later.'
                    err.style.display = 'none';
                    setTimeout(()=>err.style.display = 'block', 500)
                    document.getElementById('_pass').value = '';
                } else {
                    e.target.innerHTML = 'Logging In';
                    (function(){
                        localStorage.setItem('bG9nZ2VkaW51c2Vy', resp);
                        return Promise.resolve();
                    }()).then(()=>{
                        window.location = window.$domain+'/me'
                    })
                }
            }
        }
    }
})