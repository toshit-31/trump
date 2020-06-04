// component builder
var validator = function(compName, validationRules){
    Vue.component(compName+'-validation', {
        template : `<input v-bind:class= '{inv:!isValid}' v-bind:type= 'type' v-model= 'val' v-bind:id= 'id' v-bind:name= 'id' v-on:keyup= 'check()' v-on:focus= 'showHelper()' v-on:blur= 'hideHelper()' />`,
        data : function(){
            return {
                id: this.$attrs.id,
                type : this.$attrs.type,
                label : this.$attrs['data-label'],
                ruleMsg : this.$attrs.rules,
                val: '',
                isValid: true,
                rules: {
                    input : validationRules
                },
                formHelper : document.getElementById('form-helper')
            }
        },
        methods : {
            fillRule(){
                var ruleList = this.ruleMsg.split(',');
                var fh = this.formHelper;
                fh.querySelector('p').innerHTML = '';
                ruleList.forEach(function(e){
                    fh.querySelector('p').innerHTML += `<li>${e}</li>`
                })
            },
            check(){
                var fh = this.formHelper;
                var val = validate({input : this.val}, this.rules)
                if(val){
                    fh.classList.remove('val');
                    fh.classList.add('inv');
                    this.isValid = false;
                    this.fillRule();
                } else {
                    fh.classList.remove('inv');
                    fh.classList.add('val');
                    this.isValid = true;
                    this.formHelper.querySelector('p').innerHTML='';
                }
                setTimeout(toggleSubmit, 200);
            },
            showHelper(){
                this.fillRule();
                this.formHelper.querySelector('span').innerHTML = this.label;
                this.formHelper.classList.add('show');
                this.check();
            },
            hideHelper(){
                this.formHelper.classList.remove('show');
                this.check();
            }
        }
    })
}
// initialise components
validator('text', {
    presence: true,
    length: {
        maximum : 15,
        minimum: 6
    },
    format: /[a-zA-Z0-9_\$]+/
})
validator('email', {
    email: true
})
validator('pass', {
    presence: true,
    length: {
        minimum: 6,
        maximum: 20
    }
})
/*
<input-validation />
attributes : 
    data-label;
    type;
    id;
    rules;
*/