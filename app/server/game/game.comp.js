class pile {
    
    constructor(arr){
        this.$pile = [];
    }

    putin(cards){
        switch(typeof cards){
            case 'string' : {
                this.$pile.push(cards);
                break;
            }
            case 'object' : {
                this.$pile = this.$pile.concat(cards);
                break;
            }
            default : {
                throw Error('Invalid input for card')
            }
        }
        return this;
    }

    throwout(cards){
        switch(typeof cards){
            case 'string' : {
                this.$pile.splice(this.$pile.indexOf(cards), 1);
                break;
            }
            case 'object' : {
                cards.forEach(el => {
                    if(this.$pile.indexOf(el) > -1){
                        this.$pile.splice(this.$pile.indexOf(cards), 1)
                    } else {
                        throw Error('Card '+el+' is not present in the pile');
                    }
                });
                break;
            }
            default : {
                throw Error('Invalid input for card')
            }
        }
        return this;
    }

    show(){
        console.log(this.$pile)
    }
}

class deck{

    #cardNumbers = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    #suits = ['S', 'H', 'D', 'C'];

    constructor(){
        this.$deck = [];
    }

    draw(a){
        if(typeof a == 'number'){
            var currPile = [];
            var i = 0;
            while(i < a){
                var cardNum = parseInt(Math.random()*1000)%13;
                var suitNum = parseInt(Math.random()*100)%4;
                var card = this.#cardNumbers[cardNum]+this.#suits[suitNum];
                if (this.$deck.indexOf(card) < 0){
                    this.$deck.push(card)
                    currPile.push(card);
                    i++;
                }
            }
            return currPile;
        } else {
            return a;
        }
    }

    show(){
        return (this.$deck)
    }
}
const parseCard = function(card){
    var cardSuit = card.slice(-1);
    var cardNum = card.slice(0, -1)
    if(!isNaN(cardNum)){
        cardNum = parseInt(cardNum)-1;
    } else {
        switch(cardNum){
            case 'J' : cardNum=10;break;
            case 'Q' : cardNum=11;break;
            case 'K' : cardNum=12;break;
            case 'A' : cardNum=13;break;
        }
    }
    return {
        num : cardNum,
        suit : cardSuit
    }
}
const parseComp = function(num, suit){
    if(num <= 9){
        num++;
    } else {
        switch(num){
            case 10 : num='J';break;
            case 11 : num='Q';break;
            case 12 : num='K';break;
            case 13 : num='A';break;
        }
    }
    return num+suit;
}
module.exports = {
    pile : pile,
    deck : deck,
    parseCard : parseCard,
    parseComp : parseComp
}