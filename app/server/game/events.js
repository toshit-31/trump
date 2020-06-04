const events = {
    rec : {
        trump_select : 0x1,
        card_played : 0x5,
        player_ready : 0x00,
        trump_selected : 0x8,
        player_details : 0x13,
        quit:0x16
    },
    
    send : {
        cards_five: 0x7,
        player_index : 0x01,
        breaker : 0x0,
        trump_selected : 0x2,
        rest_cards : 0x3,
        game_started : 0x4,
        player_turn: 0x6,
        set_result : 0x9,
        other_played : 0x10,
        player_details : 0x12,
        others_turn : 0x14,
        winner:0x15,
        quit : 0x17,
        game_state :0x18,
        remaining_cards : 0x19
    }
}
module.exports.Events = events
