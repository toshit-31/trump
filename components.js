var userDetail = Vue.component('user-detail', {
    template: `<div class= '_user'>
        <div class= '_basic'>
            <img v-bind:src= 'dp' width= 96 height= 96 />
            <p>
                <input type= 'text' class= '_m' v-bind:value= 'mail' readonly />
                <input type= 'text' class= '_n' v-model= 'name' />
            </p>
        </div>
        <div class= '_info'>
            Game Balance : 
            <input type= 'number' v-model= 'bal' steps= '50'/>
            Wins : 
            <input type= 'number' v-bind:value = 'gwon' readonly>
            Losses : 
            <input type= 'number' v-bind:value = 'gloss' readonly>
        </div>
        <div class= '_edit'>
            <button class= 'btn _change' v-on:click= 'changeDataReq()'>Change</button>
            <button class= 'btn _del' v-on:click= 'deleteAccountReq()'>Delete Account</button>
        </div>
    </div>`,
    data(){
        return {
            dp : 'avs/'+this.$attrs.dp,
            mail : this.$attrs.mail,
            name : this.$attrs.name,
            savedName : this.$attrs.name,
            bal : this.$attrs.bal,
            savedBal : this.$attrs.bal,
            gwon : this.$attrs.won,
            gloss : this.$attrs.loss,
        }
    },
    methods : {
        changeDataReq(){
            var xhr = new XMLHttpRequest();
            var changeUrl = 'http://127.0.0.1:3000/change/'+btoa(this.mail)+'?name='+(this.name || this.savedName)+'&bal='+(this.bal || this.savedBal);
            console.log(changeUrl)
            xhr.open('PUT', changeUrl);
            xhr.send();
            xhr.onreadystatechange = function(){
                if(this.readyState == 4 && this.status == 200) {
                    document.querySelector('#q_res').innerHTML = 'Changes were uploaded !'
                }
            }
        }, 
        deleteAccountReq(){
            var xhr = new XMLHttpRequest();
            var changeUrl = 'http://127.0.0.1:3000/delete/'+btoa(this.mail);
            xhr.open('DELETE', changeUrl);
            xhr.send();
            xhr.onreadystatechange = function(){
                if(this.readyState == 4 && this.status == 200) {
                    document.querySelector('#q_res').innerHTML = 'Account Deleted !'
                }
            }
        }
    }
})