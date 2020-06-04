(function(){
    window.$domain = window.location.protocol+'//'+window.location.host;
    var path = window.location.pathname;
    function redirect(){
        window.location.assign(window.$domain+'/login');
    }
    const logged = localStorage.getItem('bG9nZ2VkaW51c2Vy');
    logged ? function(){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', window.$domain+'/query/findlog/'+logged);
        xhr.send();
        xhr.onreadystatechange = function(){
            if (this.readyState == 4){
                if (this.response == 'true'){
                    
                } else {
                    false;
                }
            }
        }
    }() : redirect();
}())