var database;

function cardSearch(search, set) {
	var cardset = database[set.toUpperCase()].cards;
	for(var key in cardset) {
    if(cardset.hasOwnProperty(key)) {
      var card = cardset[key];
      if(typeof search === "string") {
        if(search === card.name) {
          return JSON.parse(JSON.stringify(card));
        }
      } else if(typeof search === "number") {
        if(search == card.number) {
          return JSON.parse(JSON.stringify(card));
        }
      }
    } 
  }
}
function findCardByMvId(mv_id) {
	for(var key in database) {
    if(database.hasOwnProperty(key)) {
      var set = database[key];
      for(var cardkey in set.cards) {
        if(set.cards.hasOwnProperty(cardkey)) {
          var card = set.cards[cardkey];
          if(card.multiverseid === mv_id) {
            return card;
          }
        }
      }
    }
	}
}
function convertMana(card, mana, remove) {
	if(card.manaCost !== undefined) {
		var cost = card.manaCost;
		cost = cost.slice(1, -1);
		cost = cost.split("}{");
		for(var i=0;i<cost.length;i++) {
			if(cost[i] === "G") {
				if(!remove) {
					mana.green += 1;
				} else {
					mana.green -= 1;
				}
			}
			if(cost[i] === "R") {
				if(!remove) {
					mana.red += 1;
				} else {
					mana.red -= 1;
				}
			}
			if(cost[i] === "B") {
				if(!remove) {
					mana.black += 1;
				} else {
					mana.black -= 1;
				}
			}
			if(cost[i] === "U") {
				if(!remove) {
					mana.blue += 1;
				} else {
					mana.blue -= 1;
				}
			}
			if(cost[i] === "W") {
				if(!remove) {
					mana.white += 1;
				} else {
					mana.white -= 1;
				}
			}
		}
		return mana;
	}
}
function Deck(name, type, commander) {
	this.name = name;
	this.deckType = type;
	this.commander = commander;
	this.deckList = [];
	this.cards = {};
	this.cardCount = 0;
	this.distribution = {
		Creature: 0,
		Land: 0,
		Other: 0
	};
	this.manaCounts = {
		green: 0,
		red: 0,
		black: 0,
		blue: 0,
		white: 0
	};
	this.addCards = function(numbers, set, quantity) {
		//iterate over each card number
		for(var i=0; i<numbers.length; i++ ) {
			var number = numbers[i];
			if(quantity === undefined) { quantity = 1; }

			//gets card object from JSON database
			var card = cardSearch(number, set);

			// create card object for this.cards
			this.cards[card.name] = card;
			this.cards[card.name].quantity = quantity;

			//add to this.cardCount
			this.cardCount += card.quantity;

			// add to this.manaCounts
			convertMana(card, this.manaCounts);

			//add to this.distribution
			var types = typeof card.types === "string" ? card.types : card.types.join("_");
			if(types === "Creature" || types === "Land"){
				this.distribution[types] += card.quantity;
			} else {
				this.distribution.Other += card.quantity;
			}

			//add to this.deckList
			for(var j=0;j<quantity;j++) {
				this.deckList.push(card.name);
			}
		}
	};
	this.addCardsByMvid = function(mv_id) {
		var card = findCardByMvId(mv_id);
		// create card object for this.cards
		
		if(this.cards[card.name] === undefined) {
			this.cards[card.name] = card; 
			this.cards[card.name].quantity = 1;
		} else {
			this.cards[card.name].quantity += 1;
		}

		//add to this.cardCount
		this.cardCount += 1;

		// add to this.manaCounts
		convertMana(card, this.manaCounts);

		//add to this.distribution
		var types = typeof card.types === "string" ? card.types : card.types.join("_");
		if(types === "Creature" || types === "Land"){
			this.distribution[types] += 1;
		} else {
			this.distribution.Other += 1;
		}

		//add to this.deckList
		this.deckList.push(card.name);
	};
	this.removeCardsByMvid = function(mv_id) {
		var card = findCardByMvId(mv_id);
		if(this.cards[card.name] === undefined) {
			return
		}
		if(this.cards[card.name].quantity >= 2) {
			this.cards[card.name].quantity -= 1;
		} else if(this.cards[card.name].quantity === 1) {
			delete this.cards[card.name];
		}
		this.cardCount -= 1;
		convertMana(card, this.manaCounts, true);
		var types = typeof card.types === "string" ? card.types : card.types.join("_");
		if(types === "Creature" || types === "Land"){
			this.distribution[types] -= 1;
		} else {
			this.distribution.Other -= 1;
		}
		var index = this.deckList.indexOf(card.name);
		this.deckList.splice(index, 1);
	};
	this.draw = function(drawCount) {
		var deck = this.deckList;

		//removes the commander from the deck
		if(this.deckType === "commander") {
			var index = deck.indexOf(this.commander);
			deck = deck.slice(0,index).concat(deck.slice(index+1));
		}
		//randomizes the deck
		var shuffledDeck = [];
		var deckSize = deck.length;
		for(var i=0;i<deckSize;i++) {
			var random = Math.floor(Math.random()*deck.length);
			shuffledDeck.push(deck[random]);
			deck = deck.slice(0,random).concat(deck.slice(random+1));
		}
		//draws cards
		var cardDraw = shuffledDeck.slice(0,drawCount);
		return cardDraw;
	};
	this.renderCards = function(cards) {
		var HTML = '<ul class="cards">';
		for(var i=0;i<cards.length;i++) {
			var card = this.cards[cards[i]];
			HTML +="<li><img src='http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.multiverseid + "&type=card' alt='" + card.name + "'></li>";
		}
		HTML += "</ul>";
		return HTML;
	};
	this.deckByCmc = function() {
		var deck = this.deckList;
		var HTML = "";
		for(var mana = 1;mana<9;mana++) {
			HTML += "<div class='cmc-sort'>";
			HTML += '<h1 class="manaTitle">Mana Cost: ' + mana + '</h1>';
			var sorted = [];
			for(var i=0;i<deck.length;i++) {
				var card = this.cards[deck[i]];
				if(card.cmc === mana) {
					sorted.push(deck[i]);
				}
			}
			HTML += this.renderCards(sorted);
			HTML += "</div>";
		}
		return HTML;
	};
	this.renderManaCurve = function() {
		var curve = {};
		var totalMana = 0;
		var totalCards = 0;
		for(var key in this.cards) {
      if(this.cards.hasOwnProperty(key)) {
        var card = this.cards[key];
        if(curve[card.cmc] !== undefined && card.cmc !== undefined) {
          curve[card.cmc] += card.quantity;
          totalMana += card.cmc;
          totalCards ++;
        } else if(card.cmc !== undefined) {
          curve[card.cmc] = card.quantity;
          totalMana += card.cmc;
          totalCards ++;
        }
    	}
		}
		var average = totalMana/totalCards;
		console.log("Mana Curve: ", curve);
		console.log("Average CMC: " + average);
		return curve;
	};
	this.exportDeck = function() {
		var deck = {};
		deck.name = this.name;
		deck.type = this.deckType;
		deck.commander = this.commander;
		deck.cards = [];
		for(var key in this.cards) {
      if(this.cards.hasOwnProperty(key)) {
        deck.cards.push(this.cards[key].multiverseid);
    	}
		}
		return deck;
	};
}