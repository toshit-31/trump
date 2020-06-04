function toggleSubmit(){
    var formEl = document.querySelector('form');
    var submitBtn = formEl.querySelector('#submit');
    var emptyFields = [];
    [].forEach.call(formEl.querySelectorAll('input[data-label]'), function(el){
        el.value == '' ? emptyFields.push(el) : false;
    })
    var invFeilds = formEl.querySelector('.inv');
    if (invFeilds === null && emptyFields.length == 0){
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}