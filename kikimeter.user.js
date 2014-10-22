// ==UserScript==
// @name				LeekWars : LeeKikiMeter
// @version				0.4.4
// @description			Ce script améliore le rapport de combat : affiche un résumé des combats de leekwars, des graphes et tableaux d'analyse
// @author				Elzéar, yLark, Foudge, AlexClaw
// @match				http://leekwars.com/report/*
// @projectPage			https://github.com/Zear06/LeekWars_Kikimeter
// @downloadURL			https://github.com/Zear06/LeekWars_Kikimeter/raw/master/kikimeter.user.js
// @updateURL			https://github.com/Zear06/LeekWars_Kikimeter/raw/master/kikimeter.user.js
// @grant				GM_getValue
// @grant				GM_setValue
// @grant				GM_addStyle
// @grant				GM_getResourceText
// @require				https://code.jquery.com/jquery-2.1.1.min.js
// @require				http://kryogenix.org/code/browser/sorttable/sorttable.js
// @require				https://raw.githubusercontent.com/mbostock/d3/master/d3.min.js
// @require				https://raw.githubusercontent.com/shutterstock/rickshaw/master/vendor/d3.layout.min.js
// @require				https://raw.githubusercontent.com/shutterstock/rickshaw/master/rickshaw.min.js
// @resource			rickshaw_css	https://raw.githubusercontent.com/Zear06/LeekWars_Kikimeter/master/rickshaw.css
// ==/UserScript==

// URL DE LA PAGE PHP QUI RÉCEPTIONNE LES DONNÉES
var dataReceiverURL = ''; // http://<TRUC>/get.php

// Données affichées par défaut (1 = affiché, 0 = masqué)
var dispData = {
	'level': 1,
	'XP': 0,
	'dmg_in': 1,
	'dmg_out': 1,
	'heal_in': 1,
	'heal_out': 1,
	'vitality_in': 0,
	'vitality_out': 0,
	'lastHits': 1,
	'usedPT': 1,
	'PTperTurn': 1,
	'usedPM': 1,
	'roundsPlayed': 1,
	'equipWeapon': 0,
	'actionsWeapon': 1,
	'actionsChip': 1,
	'gainXP': 0,
	'gainTalent': 0,
	'gainHabs': 0,
	'fails': 1,
	'blabla': 0,
	'crashes': 1,
	'cellPos': 0,
	'farmer': 0,
	'id': 0,
	'life': 0,
	'force': 0,
	'agility': 0,
	'pt': 0,
	'pm': 0,
	'frequency': 0,
	'appearence': 0,
	'skin': 0
};

// STATICS
var STORAGE_PREFIX = "kikimeter-";
var STORAGE_DISPLAY_PREFIX = "kikimeter-display-";

// Récupération de la configuration dans le local storage. Si une valeur n'est pas présente, on prend la valeur par défaut

var cookieDataReceiverURL = GM_getValue("kikimeter-dataReceiverURL", "");
if (cookieDataReceiverURL != "" && (cookieDataReceiverURL == dataReceiverURL || dataReceiverURL == "")) {
	dataReceiverURL = cookieDataReceiverURL;
} else {
	GM_setValue("kikimeter-dataReceiverURL", dataReceiverURL);
}

for (var key in dispData) {
	var value = GM_getValue(STORAGE_PREFIX + key, "");
	if (value !== "") {
		dispData[key] = value;
	} else {
		GM_setValue(STORAGE_PREFIX + key, dispData[key]);
	}
}

// Modules
var leekikimeterModules = {
	'error_notification' : 'Errors et Warnings',
	'report-general' : 'Rapport de combat',
	'report-resume' : 'Résumé',
	'main_chart_container' : 'Courbes',
	'report-PTusageTable' : 'Utilisation des PT',
	'report-highlights' : 'Hauts faits',
	'report-actions' : 'Actions'
};

// Intitulés des variables
var leekData = { // variables relatives aux Leeks
	'leekId': 'Leek ID',
	'team': 'Équipe',
	'color': 'Couleur', // Couleur du texte du poireau
	'name': 'Nom',
	'alive': 'Vivant',
	'level': 'Niveau',
	'XP': 'XP',
	'PTperTurn': 'PT/tour',
	'gainXP': 'Gain XP',
	'gainTalent': 'Gain Talent',
	'gainHabs': 'Gain Habs',
	'agility': 'Agilité',
	'appearence': 'Apparence',
	'cellPos': 'Cellule de départ',
	'farmer': 'ID éleveur',
	'force': 'Force',
	'frequency': 'Fréquence',
	'id': 'id',
	'life': 'PV',
	'pm': 'PM de base',
	'pt': 'PT de base',
	'skin': 'Skin'
};
var roundData = { // variables relatives aux Leeks/rounds
	'roundsPlayed': 'Tours joués',
	'usedPT': 'PT utilisés',
	'usedPM': 'PM utilisés',
	'equipWeapon': 'Armes équipées', // Nombre de fois qu'une arme est équipée
	'actionsWeapon': 'Tirs', // Nombre de tirs
	'actionsChip': 'Usages Chips',
	'dmg_in': 'Dégats reçus',
	'dmg_out': 'Dégats infligés',
	'vitality_in': 'Vitalité reçue',
	'vitality_out': 'Vitalité lancée',
	'heal_in': 'Soins reçus',
	'heal_out': 'Soins lancés',
	'lastHits': 'Kills',
	'fails': 'Échecs',
	'blabla': 'Blabla',
	'crashes': 'Plantages'
};
var allData = $.extend({}, leekData, roundData);

// OBJET CURRENTFIGHT
function Fight() {
	var urlTab = document.URL.split('/');
	this.fightId = parseInt(urlTab[urlTab.length - 1]);
	this.teamFight = (document.getElementById('report-general').getElementsByClassName('report').length > 2) ? true : false; // vaut true s'il s'agit d'un combat d'équipe
	this.draw = (document.getElementsByTagName('h3')[0].textContent == 'Équipe 1') ? 1 : 0; // vaut 1 si le combat s'achève par un match nul
	this.bonus = (document.getElementsByClassName('bonus').length > 0) ? parseInt(document.getElementsByClassName('bonus')[0].textContent.replace(/[^\d.]/g, '')) : 1; // multiplicateur d'XP (par défaut : 1)
	this.nbRounds = parseInt(document.getElementById('duration').textContent.replace(/[^\d.]/g, ''));
	this.nbLeeks = 0;
	this.leeks = {};
	
	if(this.teamFight)
		this.teams = [];
	else
		this.teams = [new Team(), new Team()];

	this.addLeek = function(team, tr) {
		var name = tr.getElementsByClassName('name')[0].textContent;
		this.leeks[name] = new Leek(name, team, tr);
		this.teams[team].addLeek(name);
		this.nbLeeks++;
	}
	this.addTeam = function(team, tr) {
		this.teams.push(new Team(tr));
	}
	this.addRound = function(round) {
		for (var leek in this.leeks) {
			this.leeks[leek].addRound(round);
		}
	}

	// Retourne un tableau contenant la propriété dataName de tous les poireaux
	this.leeksAllData = function(dataName) {
		var allData = [];
		for (var leek in this.leeks) {
			allData[leek] = this.leeks[leek][dataName];
		}
		return allData;
	}

	// Retourne le total d'une data pour tous les leeks
	this.fightSum = function(dataName) {
		var dataNameSum = 0;
		for (var j in this.leeks) {
			dataNameSum += this.leeks[j][dataName];
		}
		return dataNameSum;
	}

	// Retourne la moyenne d'une data pour tous les leeks
	this.fightMean = function(dataName) {
		return this.fightSum(dataName) / this.nbLeeks;
	}

	// Retourne la somme d'une data d'une équipe
	this.teamSum = function(teamNumber, dataName) {
		var dataNameSum = 0;
		for (var j in this.leeks) {
			if (this.leeks[j].team == teamNumber) {
				dataNameSum += this.leeks[j][dataName];
			}
		}
		return dataNameSum;
	}

	// Retourne un tableau de toutes les actions réalisées au cours du combat : {'action' : nom_de_laction, 'PTcount' : nombre_de_PT_utilisés_par_tous_les_poireaux}
	this.actionsDone = function() {
		var actionsDone = [];
		for (var i in this.leeks) { // Boucle sur les poireaux
			for (var j in this.leeks[i].PTusage) { // Boucle sur les actions réalisées par ce poireau
				if (actionsDone[j] == undefined || actionsDone[j] == null) // Test si l'action n'a pas déjà été stockée dans le tableau
					actionsDone[j] = {
					'action': j,
					'PTcount': 0
				}; // Créé l'action dans le tableau récap
				actionsDone[j].PTcount += this.leeks[i].PTusage[j]; // Incrémente l'action du nombre de PT
			}
		}

		// Supprime les clef du tableau (sinon, le tri ne fonctionne pas)
		var tempArray = [];
		for (var i in actionsDone) tempArray.push(actionsDone[i]);

		// Tri le tableau
		tempArray.sort(function(a, b) {
			return b.PTcount - a.PTcount
		});

		return tempArray;
	}

	this.sumRounds = function() {
		for (var leek in this.leeks) {
			this.leeks[leek].sumRounds();
			this.leeks[leek].makePTperTurn();
		}
	}
}

// OBJET LEEK
function Leek(name, team, tr) {

	var linkTab = tr.getElementsByTagName('a')[0].href.split('/');
	this.leekId = parseInt(linkTab[linkTab.length - 1]); // Numéro du poireau dans le jeu
	this.name = name;
	this.team = team;
	//this.level = parseInt(tr.getElementsByClassName('level')[0].textContent.replace(/[^\d.]/g, ''));
	this.XP = parseInt(document.getElementById('tt_' + tr.getElementsByClassName('xp')[0].children[0].id).textContent.split('/')[0].replace(/[^\d.]/g, ''));
	this.alive = (tr.getElementsByClassName('name')[0].children[0].className == 'alive') ? 1 : 0;
	this.gainXP = parseInt(tr.getElementsByClassName('xp')[0].children[1].textContent.replace(/[^\d.]/g, ''));
	this.gainTalent = parseInt(tr.getElementsByClassName('talent')[0].textContent.replace(/[^\-?\d.]/g, ''));
	this.gainHabs = parseInt(tr.getElementsByClassName('money')[0].children[0].firstChild.textContent.replace(/[^\d.]/g, ''));
	this.round = {};
	this.PTusage = {};

	// Récupère l'id du poireau en se basant sur son nom (ne fonctionne pas en cas de combat contre soi-même)
	for (var leek in rawFightData.leeks) {
		if (rawFightData.leeks[leek].name == this.name) {
			this.rawFightDataId = leek;
			break;
		}
	}

	this.agility = rawFightData.leeks[this.rawFightDataId].agility;
	this.appearence = rawFightData.leeks[this.rawFightDataId].appearence;
	this.cellPos = rawFightData.leeks[this.rawFightDataId].cellPos; // Position du poireau en début de combat
	this.farmer = rawFightData.leeks[this.rawFightDataId].farmer; // Éleveur du poireau
	//this.farmerName = ; // Requête ajax needed
	this.force = rawFightData.leeks[this.rawFightDataId].force;
	this.frequency = rawFightData.leeks[this.rawFightDataId].frequency;
	this.id = rawFightData.leeks[this.rawFightDataId].id; // Numéro unique du poireau dans le cadre du combat
	this.level = rawFightData.leeks[this.rawFightDataId].level;
	this.life = rawFightData.leeks[this.rawFightDataId].life;
	//this.name = rawFightData.leeks[this.rawFightDataId].name;
	this.pm = rawFightData.leeks[this.rawFightDataId].pm;
	this.pt = rawFightData.leeks[this.rawFightDataId].pt;
	this.skin = rawFightData.leeks[this.rawFightDataId].skin;
	//this.team = rawFightData.leeks[this.rawFightDataId].team;

	this.addToPTusageData = function(dataName, value) {
		if (isNaN(this.PTusage[dataName]))
			this.PTusage[dataName] = 0;
		this.PTusage[dataName] += value;
	};
	this.writeData = function(dataName, value) { // Initialise une valeur
		this[dataName] = value;
	};
	this.addToData = function(dataName, value) { // Incrémente une valeur
		this[dataName] += value;
	};
	this.addRound = function(round) {
		this.round[round] = {};
		for (var key in roundData) {
			this.round[round][key] = 0;
		}
	}
	this.writeRoundData = function(round, dataName, value) {
		this.round[round][dataName] = value;
	};
	this.addToRoundData = function(round, dataName, value) {
		this.round[round][dataName] += value;
	};
	this.getRoundData = function(round, dataName) {
		return this.round[round][dataName];
	};
	this.sumRoundsDataRouns = function(dataName, firstRound, lastRound) {
		this[dataName] = 0;
		for (var i = firstRound; i <= lastRound; i++) {
			this[dataName] += this.round[i][dataName];
		}
	}
	this.sumRoundsData = function(dataName) {
		this.sumRoundsDataRouns(dataName, 1, Object.keys(this.round).length);
	}
	this.sumRounds = function() {
		for (var dataName in roundData) {
			this.sumRoundsData(dataName);
		}
	}
	this.makePTperTurn = function() {
		this.PTperTurn = this.usedPT / this.roundsPlayed;
	}
}

// OBJET TEAM
function Team(tr) {
	this.nbLeeks = 0;
	this.leeks = [];

	if(tr != null) {
		var linkTab = tr.getElementsByTagName('a')[0].href.split('/');
		this.teamId = parseInt(linkTab[linkTab.length - 1]); // Numéro de la team dans le jeu

		this.name = tr.getElementsByClassName('name')[0].textContent;
		this.level = parseInt(tr.getElementsByClassName('level')[0].textContent.replace(/[^\d.]/g, ''));
		this.XP = parseInt(document.getElementById('tt_' + tr.getElementsByClassName('xp')[0].children[0].id).textContent.split('/')[0].replace(/[^\d.]/g, ''));
		this.gainXP = parseInt(tr.getElementsByClassName('xp')[0].children[1].textContent.replace(/[^\d.]/g, ''));
	}
	
	this.addLeek = function(name) {
		this.leeks.push(name);
		this.nbLeeks++;
	}
	
	this.color = function() {
		return currentFight.leeks[this.leeks[0]].color;
	}
}

// OBJET HIGHLIGHT (fait marquant, ou trophée)
function Highlight(img, title, description, message) {
	this.img = img;
	this.title = title;
	this.description = description;
	this.message = message;
}

// Lit les tableaux d'équipes
function readTables() {
	var report_tables = document.getElementById('report-general').getElementsByTagName('table');
	var a = true;

	for (i = 0; i < report_tables.length; i++) {
		var team = (currentFight.teamFight) ? (i - 1) / 2 : i;
		if ((!currentFight.teamFight) || (i == 1) || (i == 3)) {
			var trs = report_tables[i].children[0].children;

			for (var j = 1; j < trs.length; j++) {
				if (trs[j].className != 'total') {
					currentFight.addLeek(team, trs[j]);
				}
			}
		} else if ((currentFight.teamFight) && ((i == 0) || (i == 2))) {
			currentFight.addTeam(team, report_tables[i].children[0].children[1]);
		}
	}
}

// Lit la liste des actions
function readActions() {
	var actions = document.getElementById('actions').children;

	var attacker;
	var lastPTcount = null; // Stock le dernier décompte de PT, pour le suivi de l'usage des PT par arme/puce/etc.
	var lastPTaction = null; // Stock la dernière action, pour le suivi de l'usage des PT par arme/puce/etc.
	var currentWeapon = []; // Stock l'arme actuellement équipée pour chaque poireau

	for (var i in actions) {
		// NUMÉRO DE TOUR
		if (/^Tour ([0-9]+)$/.test(actions[i].textContent)) {
			var round = RegExp.$1;
			currentFight.addRound(round);
		}

		// VARIABLES UTILES POUR LES ACTIONS DE PLUSIEURS LIGNES
		if (/^([^\s]+) tire$/.test(actions[i].textContent)) {
			attacker = RegExp.$1;
			var attackerWeapon = RegExp.$1;
			currentFight.leeks[attacker].addToRoundData(round, 'actionsWeapon', 1);
			lastPTaction = currentWeapon[RegExp.$1];

		}
		if (/^([^\s]+) lance (.+)$/.test(actions[i].textContent)) {
			attacker = RegExp.$1;
			var attackerChip = RegExp.$1;
			currentFight.leeks[attacker].addToRoundData(round, 'actionsChip', 1);
			lastPTaction = RegExp.$2;
		}

		// TOUR DE [LEEKNAME]
		if (/^Tour de ([^\s]+)$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].writeRoundData(round, 'roundsPlayed', 1);
			currentFight.leeks[RegExp.$1].writeData('color', actions[i].children[0].style.color); // Récupère et stock la couleur du texte du poireau
			var currentLeek = RegExp.$1;
			attacker = null; // Réinitialise l'attacker. Permet de ne pas lui attribuer des heal ou damage overtime lancés par un autre
		}

		// usedPT
		if (/^([^\s]+) perd ([0-9]+) PT$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'usedPT', parseInt(RegExp.$2));
			lastPTcount = parseInt(RegExp.$2);
		}

		// usedPM
		if (/^([^\s]+) perd ([0-9]+) PM$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'usedPM', parseInt(RegExp.$2));
		}

		// DEGATS
		if (/^([^\s]+) perd ([0-9]+) PV$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'dmg_in', parseInt(RegExp.$2.replace(/[^\d.]/g, '')));
			if (attacker != null) currentFight.leeks[attacker].addToRoundData(round, 'dmg_out', parseInt(RegExp.$2.replace(/[^\d.]/g, '')));
		}

		// SOINS
		if (/^([^\s]+) gagne ([0-9]+) PV$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'heal_in', parseInt(RegExp.$2.replace(/[^\d.]/g, '')));
			if (attacker != null) currentFight.leeks[attacker].addToRoundData(round, 'heal_out', parseInt(RegExp.$2.replace(/[^\d.]/g, '')));
		}
		
		// VITALITÉ
		if (/^([^\s]+) gagne ([0-9]+) vitalité$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'vitality_in', parseInt(RegExp.$2.replace(/[^\d.]/g, '')));
			if (attacker != null) currentFight.leeks[attacker].addToRoundData(round, 'vitality_out', parseInt(RegExp.$2.replace(/[^\d.]/g, '')));
		}

		// ARME ÉQUIPÉE
		//if (/^([^\s]+) prend l'arme ([^\s]+)$/.test(actions[i].textContent)) {
		if (/^([^\s]+) prend l'arme (.+)$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'equipWeapon', 1);
			currentWeapon[RegExp.$1] = RegExp.$2; // Stock l'arme en cours du poireau
			lastPTaction = 'Arme équipée';
		}

		// ECHEC
		if (/^([^\s]+) tire... Échec !$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'fails', 1);
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'actionsWeapon', 1);
			lastPTaction = 'Échec';
		}
		if (/^([^\s]+) lance (.+)... Échec !$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'fails', 1);
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'actionsChip', 1);
			lastPTaction = 'Échec';
		}

		// MORT
		if (/^([^\s]+) est mort !/.test(actions[i].textContent)) {
			if (attacker != null) currentFight.leeks[attacker].addToRoundData(round, 'lastHits', 1);
		}

		// BLABLA
		if (/^([^\s]+) dit : /.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'blabla', 1);
			lastPTaction = 'Blabla';
		}

		// PLANTAGE
		if (/^([^\s]+) a planté !$/.test(actions[i].textContent)) {
			currentFight.leeks[RegExp.$1].addToRoundData(round, 'crashes', 1);
		}

		// Incrémente les données de la dernière action. Comme parfois les PT sont décomptés avant que les actions ne soient annoncées, ou vice-versa, on attend que les deux infos soient rassemblées pour comptabiliser
		if (lastPTaction != null && lastPTcount != null) {
			currentFight.leeks[currentLeek].addToPTusageData(lastPTaction, lastPTcount);
			lastPTaction = null;
			lastPTcount = null;
		}
	}
}

// Génère les highlights
function generateHighlights() {

	// Tueur
	var BestLeek = getBestLeek('lastHits', 'max');
	if (BestLeek != null) {
		Highlights['tueur'] = new Highlight('http://static.leekwars.com/image/trophy/feller.png', 'Tueur', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a tué ' + currentFight.leeks[BestLeek]['lastHits'] + ' poireaux', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['lastHits'] / currentFight.fightSum('lastHits') * 100) + ' % des tués');
	}

	// Guerrier
	var BestLeek = getBestLeek('dmg_out', 'max');
	if (BestLeek != null) {
		Highlights['guerrier'] = new Highlight('http://static.leekwars.com/image/trophy/fighter.png', 'Guerrier', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a infligé ' + currentFight.leeks[BestLeek]['dmg_out'] + ' dégâts', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['dmg_out'] / currentFight.fightSum('dmg_out') * 100) + ' % des dégâts');
	}

	// Médecin
	var BestLeek = getBestLeek('heal_out', 'max');
	if (BestLeek != null) {
		Highlights['medecin'] = new Highlight('http://static.leekwars.com/image/trophy/carapace.png', 'Médecin', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a soigné ' + currentFight.leeks[BestLeek]['heal_out'] + ' PV', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['heal_out'] / currentFight.fightSum('heal_out') * 100) + ' % des soins');
	}

	// Bavard
	var BestLeek = getBestLeek('blabla', 'max');
	if (BestLeek != null && currentFight.leeks[BestLeek]['blabla'] > 2) {
		Highlights['bavard'] = new Highlight('http://static.leekwars.com/image/trophy/talkative.png', 'Bavard', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a parlé ' + currentFight.leeks[BestLeek]['blabla'] + ' fois', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['blabla'] / currentFight.fightSum('blabla') * 100) + ' % de ce qui a été dit');
	}

	// Éphémère
	var BestLeek = getBestLeek('roundsPlayed', 'min');
	if (BestLeek != null && currentFight.leeks[BestLeek]['roundsPlayed'] / max(currentFight.leeksAllData('roundsPlayed')) * 100 < 50) {
		Highlights['ephemere'] = new Highlight('http://static.leekwars.com/image/trophy/gardener.png', 'Éphémère', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> n\'a survécu que ' + currentFight.leeks[BestLeek]['roundsPlayed'] + ' tours', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['roundsPlayed'] / max(currentFight.leeksAllData('roundsPlayed')) * 100) + ' % du combat');
	}

	// Marcheur
	var BestLeek = getBestLeek('PM', 'max');
	if (BestLeek != null) {
		Highlights['marcheur'] = new Highlight('http://static.leekwars.com/image/trophy/walker.png', 'Marcheur', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a marché ' + currentFight.leeks[BestLeek]['PM'] + ' PM', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['PM'] / currentFight.fightSum('PM') * 100) + ' % des distances parcourues');
	}

	// Tireur
	var BestLeek = getBestLeek('actionsWeapon', 'max');
	if (BestLeek != null) {
		Highlights['tireur'] = new Highlight('http://static.leekwars.com/image/trophy/equipped.png', 'Tireur', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a tiré ' + currentFight.leeks[BestLeek]['actionsWeapon'] + ' fois', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['actionsWeapon'] / currentFight.fightSum('actionsWeapon') * 100) + ' % des tirs');
	}

	// Malchanceux
	var BestLeek = getBestLeek('fails', 'max');
	if (BestLeek != null) {
		Highlights['malchanceux'] = new Highlight('http://static.leekwars.com/image/trophy/lucky.png', 'Malchanceux', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a subi ' + currentFight.leeks[BestLeek]['fails'] + ' échecs', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['fails'] / currentFight.fightSum('fails') * 100) + ' % des échecs');
	}

	// Magicien
	var BestLeek = getBestLeek('actionsChip', 'max');
	if (BestLeek != null) {
		Highlights['magicien'] = new Highlight('http://static.leekwars.com/image/trophy/wizard.png', 'Magicien', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a utilisé des puces ' + currentFight.leeks[BestLeek]['actionsChip'] + ' fois', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['actionsChip'] / currentFight.fightSum('actionsChip') * 100) + ' % des puces');
	}

	// Buggé
	var BestLeek = getBestLeek('crashes', 'max');
	if (BestLeek != null) {
		Highlights['bugge'] = new Highlight('http://static.leekwars.com/image/trophy/breaker.png', 'Buggé', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a planté ' + currentFight.leeks[BestLeek]['crashes'] + ' fois', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['crashes'] / currentFight.fightSum('crashes') * 100) + ' % des plantages');
	}

	// Hyperactif
	var BestLeek = getBestLeek('PTperTurn', 'max');
	if (BestLeek != null && currentFight.nbLeeks > 2) {
		Highlights['hyperactif'] = new Highlight('http://static.leekwars.com/image/trophy/motivated.png', 'Hyperactif', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a un ratio de ' + Math.round(currentFight.leeks[BestLeek]['PTperTurn'] * 10) / 10 + ' PT par tour', 'Soit ' + Math.round(currentFight.leeks[BestLeek]['PTperTurn'] / mean(currentFight.leeksAllData('PTperTurn')) * 10) / 10 + ' fois plus que la moyenne');
	}

	// Glandeur
	var BestLeek = getBestLeek('PTperTurn', 'min');
	if (BestLeek != null && currentFight.nbLeeks > 2) {
		if (currentFight.leeks[BestLeek]['PTperTurn'] != 0) {
			Highlights['glandeur'] = new Highlight('http://static.leekwars.com/image/trophy/literate.png', 'Glandeur', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a un ratio PT par tour de ' + Math.round(currentFight.leeks[BestLeek]['PTperTurn'] * 10) / 10, 'Soit ' + Math.round(mean(currentFight.leeksAllData('PTperTurn')) / currentFight.leeks[BestLeek]['PTperTurn'] * 10) / 10 + ' fois moins que la moyenne');
		} else {
			Highlights['glandeur'] = new Highlight('http://static.leekwars.com/image/trophy/literate.png', 'Glandeur', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> a un ratio PT par tour de ' + Math.round(currentFight.leeks[BestLeek]['PTperTurn'] * 10) / 10, null);
		}
	}

	// Invincible
	var BestLeek = null;
	var draw = false;
	for (var j in currentFight.leeks) {
		if (BestLeek != null && currentFight.leeks[j]['dmg_in'] == currentFight.leeks[BestLeek]['dmg_in']) {
			draw = true;
		}
		if (BestLeek == null || currentFight.leeks[j]['dmg_in'] > currentFight.leeks[BestLeek]['dmg_in']) {
			BestLeek = j;
			draw = false;
		}
	}
	if (draw == false && currentFight.leeks[BestLeek]['dmg_in'] == 0) {
		Highlights['invincible'] = new Highlight('http://static.leekwars.com/image/trophy/unbeaten.png', 'Invincible', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> n\'a reçu aucun dégât', null);
	}

	// Survivant
	var BestLeek = null;
	var draw = false;
	for (var j in currentFight.leeks) {
		if (BestLeek != null && currentFight.leeks[j]['roundsPlayed'] == currentFight.leeks[BestLeek]['roundsPlayed']) {
			draw = true;
		}
		if (BestLeek == null || currentFight.leeks[j]['roundsPlayed'] > currentFight.leeks[BestLeek]['roundsPlayed']) {
			BestLeek = j;
			draw = false;
		}
	}
	if (draw == false && currentFight.nbLeeks > 2 && currentFight.teams[currentFight.leeks[BestLeek].team].nbLeeks > 1) {
		//if(draw == false &&  currentFight.nbLeeks > 2 && currentFight.teams[currentFight.leeks[BestLeek].team] > 1 ){
		Highlights['survivant'] = new Highlight('http://static.leekwars.com/image/trophy/winner.png', 'Survivant', '<span style="color:' + currentFight.leeks[BestLeek]['color'] + ';">' + currentFight.leeks[BestLeek]['name'] + '</span> est  le seul survivant', null);
	}
}

function getBestLeek(dataName, maxOrMin) { // Utile uniquement dans le cadre de la fonction generateHighlights()
	var BestLeek = null;
	var draw = false;
	var threshold;
	if (maxOrMin == 'max') {
		threshold = mean(currentFight.leeksAllData(dataName)) + (0.18 * currentFight.nbLeeks + 0.34) * stdev(currentFight.leeksAllData(dataName)); // Seuil défini en fonction de la moyenne des valeurs, de l'écart type et du nombre de poireaux impliqués dans le combat
	} else {
		threshold = mean(currentFight.leeksAllData(dataName)) - (0.18 * currentFight.nbLeeks + 0.34) * stdev(currentFight.leeksAllData(dataName));
	}
	for (var j in currentFight.leeks) {
		if (BestLeek != null && currentFight.leeks[j][dataName] == currentFight.leeks[BestLeek][dataName]) {
			draw = true;
		}
		if (BestLeek == null || (currentFight.leeks[j][dataName] > currentFight.leeks[BestLeek][dataName] && maxOrMin == 'max') || (currentFight.leeks[j][dataName] < currentFight.leeks[BestLeek][dataName] && maxOrMin == 'min')) {
			BestLeek = j;
			draw = false;
		}
	}
	if (draw == true || (currentFight.leeks[BestLeek][dataName] < threshold && maxOrMin == 'max') // S'il y a égalité avec un autre poireau, ou si la valeur ne dépasse pas un certain seuil remarquable, le highlight ne sera pas affiché
		|| (currentFight.leeks[BestLeek][dataName] > threshold && maxOrMin == 'min') || currentFight.leeks[BestLeek][dataName] == 1) // Si la valeur vaut 1, ça n'est pas suffisamment exceptionnel
		BestLeek = null;
	return BestLeek;
}

// Affiche le tableau de résumé
function displayKikimeter() {
	var table = document.createElement('table');
	table.className = 'report';

	// thead
	var thead = document.createElement('thead');

	var tr = document.createElement('tr');

	var th = document.createElement('th');
	th.appendChild(document.createTextNode('Poireau'));
	tr.appendChild(th);

	for (var i in dispData) {
		if (dispData[i] == 1) {
			var th = document.createElement('th');
			th.appendChild(document.createTextNode(allData[i]));
			tr.appendChild(th);
		}
	}

	thead.appendChild(tr);
	table.appendChild(thead);

	// tbody
	var tbody = document.createElement('tbody');

	for (var j in currentFight.leeks) {
		tr = document.createElement('tr');

		td = document.createElement('td');
		td.className = 'name';

		if (currentFight.leeks[j]['alive']) {
			var span = document.createElement('span');
			span.className = 'alive';
		} else {
			var span = document.createElement('span');
			span.className = 'dead';
			td.appendChild(span);
			span = document.createElement('span');
		}

		var a = document.createElement('a');
		a.href = '/leek/' + currentFight.leeks[j]['leekId'];
		a.style.color = currentFight.leeks[j]['color'];
		a.appendChild(document.createTextNode(currentFight.leeks[j]['name']));
		span.appendChild(a);
		td.appendChild(span);

		tr.appendChild(td);

		for (var i in dispData) {
			if (dispData[i] == 1) {
				var disp = (isNaN(currentFight.leeks[j][i])) ? currentFight.leeks[j][i] : Math.round(currentFight.leeks[j][i] * 10) / 10;
				td = document.createElement('td');
				//td.appendChild(document.createTextNode(Math.round(currentFight.leeks[j][dispData[i]]*10)/10));
				td.appendChild(document.createTextNode((disp)));
				tr.appendChild(td);
			}
		}

		tbody.appendChild(tr);
	}
	table.appendChild(tbody);

	// tfoot
	// Affichage des sommes du combat
	var tfoot = document.createElement('tfoot');

	tr = document.createElement('tr');
	tr.className = 'total';

	td = document.createElement('td');
	td.className = 'name';

	var span = document.createElement('span');
	span.className = 'alive';

	span.appendChild(document.createTextNode('Total'));
	td.appendChild(span);

	tr.appendChild(td);

	for (var i in dispData) {
		if (dispData[i] == 1) {
			td = document.createElement('td');
			td.appendChild(document.createTextNode(Math.round(currentFight.fightSum(i) * 10) / 10));
			tr.appendChild(td);
		}
	}
	tfoot.appendChild(tr);

	//Affichage des moyennes du combat
	tr = document.createElement('tr');
	tr.className = 'total';

	td = document.createElement('td');
	td.className = 'name';

	var span = document.createElement('span');
	span.className = 'alive';

	span.appendChild(document.createTextNode('Moyenne'));
	td.appendChild(span);

	tr.appendChild(td);

	for (var i in dispData) {
		if (dispData[i] == 1) {
			td = document.createElement('td');
			td.appendChild(document.createTextNode(Math.round(currentFight.fightMean(i) * 10) / 10));
			tr.appendChild(td);
		}
	}
	tfoot.appendChild(tr);

	table.appendChild(tfoot);
	// Fin affichage des sommes du combat

	var resume = document.createElement('div');
	resume.id = 'report-resume';

	// Création du titre au-dessus du tableau
	var h1 = document.createElement('h1');
	h1.appendChild(document.createTextNode('Résumé'));
	resume.appendChild(h1);
	resume.appendChild(table);

	// Insertion du tableau dans le DOM
	var page = document.getElementById('page');
	var report_actions = document.getElementById('report-actions');
	page.insertBefore(resume, report_actions);
}

// Affiche le tableau d'usage des PT
function displayPTusageTable() {
	var actionsDone = currentFight.actionsDone();

	var table = document.createElement('table');
	table.className = 'report';

	// thead
	var thead = document.createElement('thead');

	var tr = document.createElement('tr');

	var th = document.createElement('th');
	th.appendChild(document.createTextNode('Action'));
	tr.appendChild(th);

	// Créé les entêtes de colonnes avec les noms des poireaux
	for (var j in currentFight.leeks) {
		var th = document.createElement('th');
		
		var span = document.createElement('span');
		if (!currentFight.leeks[j]['alive']) {
			if(currentFight.nbLeeks <= 4) span.className = 'dead';	// N'affiche les crânes de mort que s'il y a peu de poireaux. Idéalement, il faudrait plutôt utiliser le nombre de caractères cumulé de tous les poireaux en jeu
			th.appendChild(span);
			span = document.createElement('span');
		}

		span.style.color = currentFight.leeks[j]['color'];
		span.appendChild(document.createTextNode(currentFight.leeks[j]['name']));
		th.appendChild(span);
		tr.appendChild(th);
	}

	// Total, en dernière colonne de l'entête
	var th = document.createElement('th');
	th.appendChild(document.createTextNode('Total'));
	th.className = 'total';
	tr.appendChild(th);

	thead.appendChild(tr);
	table.appendChild(thead);

	// tbody
	var tbody = document.createElement('tbody');

	for (var i in actionsDone) {
		tr = document.createElement('tr');
		td = document.createElement('td');
		td.appendChild(document.createTextNode(actionsDone[i]['action']));
		td.className = 'name';
		tr.appendChild(td);

		for (var j in currentFight.leeks) {
			var actionPT = currentFight.leeks[j].PTusage[actionsDone[i]['action']];
			if (isNaN(actionPT)) actionPT = 0;
			var disp = Math.round(actionPT / currentFight.leeks[j]['usedPT'] * 100) / 1;
			td = document.createElement('td');
			if (!isNaN(disp) && actionPT != 0) td.appendChild(document.createTextNode(disp + '%'));
			td.title = actionPT + ' PT';
			td.setAttribute('sorttable_customkey', actionPT); // Permet un tri correct par le plugin JavaScript sorttable : http://www.kryogenix.org/code/browser/sorttable/#customkeys
			tr.appendChild(td);
		}

		// Total, en dernière colonne de la ligne
		td = document.createElement('td');
		td.appendChild(document.createTextNode(Math.round(actionsDone[i]['PTcount'] / currentFight.fightSum('usedPT') * 100) + '%'));
		td.title = actionsDone[i]['PTcount'] + ' PT';
		td.setAttribute('sorttable_customkey', actionsDone[i]['PTcount']); // Permet un tri correct par le plugin JavaScript sorttable : http://www.kryogenix.org/code/browser/sorttable/#customkeys
		td.className = 'total';
		tr.appendChild(td);

		tbody.appendChild(tr);
	}
	table.appendChild(tbody);

	var resume = document.createElement('div');
	resume.id = 'report-PTusageTable';

	// Création du titre au-dessus du tableau
	var h1 = document.createElement('h1');
	h1.appendChild(document.createTextNode('Utilisation des PT'));
	resume.appendChild(h1);
	resume.appendChild(table);

	// Insertion du tableau dans le DOM
	var page = document.getElementById('page');
	var report_actions = document.getElementById('report-actions');
	page.insertBefore(resume, report_actions);
}

// Affiche les highlights
function displayHighlights() {
	generateHighlights(); // Génère les highlights avant des les insérer dans le DOM

	if (length(Highlights) > 0) {
		var report_highlights = document.createElement('div');
		report_highlights.id = 'report-highlights';

		// Création du titre
		var h1 = document.createElement('h1');
		h1.appendChild(document.createTextNode('Hauts faits'));
		report_highlights.appendChild(h1);

		for (var i in Highlights) { // Boucle sur tous les highlights préalablement générés

			var report_high = document.createElement('div');
			report_high.className = 'notif';

			if (Highlights[i].img != null) {
				var img = document.createElement('img');
				img.src = Highlights[i].img;
				report_high.appendChild(img);
			}

			if (Highlights[i].title != null) {
				var title = document.createElement('div');
				title.className = 'turn';
				title.appendChild(document.createTextNode(Highlights[i].title));
				report_high.appendChild(title);
			}

			if (Highlights[i].description != null) {
				var description = document.createElement('div');
				description.className = 'action';
				description.innerHTML = Highlights[i].description;
				report_high.appendChild(description);
			}

			if (Highlights[i].message != null) {
				var message = document.createElement('span');
				message.className = 'date';
				message.appendChild(document.createTextNode(Highlights[i].message));
				report_high.appendChild(message);
			}

			report_highlights.appendChild(report_high);
		}

		// Insertion dans le DOM
		var page = document.getElementById('page');
		var report_actions = document.getElementById('report-actions');
		page.insertBefore(report_highlights, report_actions);
	}
}

// Recolorise le nom des leeks dans le rapport général (reprend la structure et la démarche de la fonction readTables())
function colorize_report_general() {
	var report_tables = document.getElementById('report-general').getElementsByTagName('table');

	for (var i = 0; i < report_tables.length; i++) {

		if ((!currentFight.teamFight) || (i == 1) || (i == 3)) {
			var trs = report_tables[i].children[0].children;

			for (var j = 1; j < trs.length; j++) {
				if (trs[j].className != 'total') {
					var name = trs[j].children[0].textContent; // Récupère le nom du poireau

					if (trs[j].children[0].children[0].className == 'alive') {
						trs[j].children[0].children[0].children[0].style.color = currentFight.leeks[name]['color']; // Applique la couleur du poireau stockée dans la variable leeks[]
					}
					if (trs[j].children[0].children[0].className == 'dead') {
						trs[j].children[0].children[1].children[0].style.color = currentFight.leeks[name]['color']; // Applique la couleur du poireau stockée dans la variable leeks[]
					}
				}
			}
		}
	}
}

// Génération des données pour le graph Rickshaw
function getGraphSeries() {
	
	var palette_red  = new Rickshaw.Color.Palette({scheme : ['#DC3900','#F39E5B','#F34739','#E9930C','#E90C5B','#E9B106']});		// Palette de couleur perso
	var palette_blue = new Rickshaw.Color.Palette({scheme : ['#0223AB','#307DC2','#5B4BC2','#079EB8','#5B07B8','#07B897']});		// Palette de couleur perso
	var palette = new Rickshaw.Color.Palette({ scheme: 'munin' });		// Palette de couleur automatique
	var series = [];
	
	for (var leek in currentFight.leeks) {	// Boucle sur les tours pour recalculer l'évolution de la vie des poireaux
		var totalLife = currentFight.leeks[leek].life;
		var data = [];
		
		if(currentFight.nbLeeks <= 2){	// Si on est en combat solo
			var serie_color = currentFight.leeks[leek].color;
		}else if( currentFight.leeks[leek].color === 'rgb(220, 0, 0)'){	// Si on est dans l'équipe rouge
			var serie_color = palette_red.color();
		}else{
			var serie_color = palette_blue.color();
		}
		
		for (var i = 1; i <= currentFight.nbRounds; i++) {
			var dmg_in = currentFight.leeks[leek].getRoundData(i, 'dmg_in');
			var heal_in = currentFight.leeks[leek].getRoundData(i, 'heal_in');
			var vitality_in = currentFight.leeks[leek].getRoundData(i, 'vitality_in');
			var diffPV = ((heal_in != null) ? heal_in : 0) + ((vitality_in != null) ? vitality_in : 0) - ((dmg_in != null) ? dmg_in : 0);
			if (i === 1)
				data[i-1] = {'x': i, 'y': totalLife + diffPV};
			else
				data[i-1] = {'x': i, 'y': data[i - 2].y + diffPV};
			if (data[i-1].y === 0) break; // Le poireau est mort, on ne continue pas à tracer sa vie
		}
		
		var dataset = {
			name: 'PV - ' + currentFight.leeks[leek].name,
			color: serie_color,
			data: data
		};
		series.push(dataset);
	}
	
	// Calcul de l'Équilibre de vie entre l'équipe 1 et 2 et de la vie totale des équipes 1 et 2
	var data = [];
	var dataTeam0 = [];
	var dataTeam1 = [];
	var teamName = [];
	var teams = [{'TotalLife': 0, 'life': []},
				 {'TotalLife': 0, 'life': []}];
	
	if(currentFight.nbLeeks > 2) {	// Si on est en match équipe, on récupère le nom des équipes
		teamName[0] = currentFight.teams[0].name;
		teamName[1] = currentFight.teams[1].name;
		if(teamName[0] == undefined) teamName[0] = 'Éleveur 1';		//Remplacer par le vrai nom de l'éleveur (requête ajax needed sur currentFight.leeks[].farmer)
		if(teamName[1] == undefined) teamName[1] = 'Éleveur 2';		//Remplacer par le vrai nom de l'éleveur (requête ajax needed sur currentFight.leeks[].farmer)
	} else { // Si on est en match solo, chaque nom d'équipe est le nom du poireau
		for(var leek in currentFight.leeks){
			teamName.push(currentFight.leeks[leek].name);
		}
	}
	
	for (var i = 1; i <= currentFight.nbRounds; i++) {	// Boucle sur les tours pour recalculer l'évolution de la vie des équipes
	
		if(teams[0].life[i-1] == undefined) teams[0].life[i-1] = (i == 1) ? 0 : teams[0].life[i - 2];
		if(teams[1].life[i-1] == undefined) teams[1].life[i-1] = (i == 1) ? 0 : teams[1].life[i - 2];
			
		for (var leek in currentFight.leeks) {
			var team = currentFight.leeks[leek].team;
			
			if(i == 1)
				teams[team].TotalLife += currentFight.leeks[leek].life;
			
			var dmg_in = currentFight.leeks[leek].getRoundData(i, 'dmg_in');
			var heal_in = currentFight.leeks[leek].getRoundData(i, 'heal_in');
			var vitality_in = currentFight.leeks[leek].getRoundData(i, 'vitality_in');
			var diffPV = ((heal_in != null) ? heal_in : 0) + ((vitality_in != null) ? vitality_in : 0) - ((dmg_in != null) ? dmg_in : 0);
			teams[team].life[i-1] += diffPV;
		}
		
		data[i-1] = {'x': i, 'y': ((teams[1].TotalLife - teams[1].life[i-1]) / teams[1].TotalLife - (teams[0].TotalLife - teams[0].life[i-1]) / teams[0].TotalLife)*100};
		dataTeam0[i-1] = {'x': i, 'y': (teams[0].TotalLife + teams[0].life[i-1])};
		dataTeam1[i-1] = {'x': i, 'y': (teams[1].TotalLife + teams[1].life[i-1])};
	}
	
	if( currentFight.nbLeeks > 2 ){		// N'envoie les données de vie des équipes 1 et 2 seulement si on n'est pas en combat solo
		var dataset = {
			name: 'PV - ' + teamName[0],
			color: currentFight.teams[0].color(),
			data: dataTeam0
		};
		series.push(dataset);
		
		var dataset = {
			name: 'PV - ' + teamName[1],
			color: currentFight.teams[1].color(),
			data: dataTeam1
		};
		series.push(dataset);
	}
	
	var dataset = {
		name: 'Équilibre ' + teamName[0] + ' - ' + teamName[1] + ' (% PV)',
		color: palette.color(),
		data: data
	};
	series.push(dataset);
	
	return series;
}

// Affiche le graph dans la page
function displayChart() {
	
	GM_addStyle(GM_getResourceText('rickshaw_css'));	// Ajout de la feuille de style disponible dans le repository
	
	// Création des objets DOM qui vont supporter le graph
	
	var html_content = '<h1>Courbes</h1>';
	html_content += '<div id="chart_container">';
	html_content += '	<div id="chart" class="rickshaw_graph"></div>';
	//html_content += '	<div id="timeline" class="rickshaw_annotation_timeline"></div>'; // à terminer d'implémenter plus tard
	html_content += '</div>';
	
	html_content += '<div id="chart_footer">';
	html_content += '	<div id="legend"></div>';
	//html_content += '	<form id="offset_form" class="toggler">';
	//html_content += '		<input type="radio" name="offset" id="line" value="line" style="display:none;" checked>';
	//html_content += '		<label for="line" style="cursor:pointer;"><img title="Ligne" alt="Ligne" src="https://raw.githubusercontent.com/shutterstock/rickshaw/master/examples/images/om_lines.png"></label>';
	
	//html_content += '		<input type="radio" name="offset" id="stack" value="stack" style="display:none" >';
	//html_content += '		<label for="stack" style="cursor:pointer;"><img title="Empilé" alt="Empilé" src="https://raw.githubusercontent.com/shutterstock/rickshaw/master/examples/images/om_stack.png"></label>';
	
	//html_content += '		<input type="radio" name="offset" id="pct" value="pct" style="display:none" >';
	//html_content += '		<label for="pct" style="cursor:pointer;"><img title="Pourcentage" alt="Pourcentage" src="https://raw.githubusercontent.com/shutterstock/rickshaw/master/examples/images/om_percent.png"></label>';
	//html_content += '	</form>';
	html_content += '</div>';
	
	var chart = document.createElement('div');
	chart.id = 'main_chart_container';
	chart.innerHTML = html_content;
	
	// Insertion dans le DOM
	var page = document.getElementById('page');
	var report_actions = document.getElementById('report-actions');
	page.insertBefore(chart, report_actions);
	
	
	// Paramètage du graph rickshaw

	// Récupère le choix d'interpolation de l'utilisateur
	var checked = GM_getValue(STORAGE_DISPLAY_PREFIX + 'graph-interpolation', 1);
	var interpolation_choice = (checked === 1)?'monotone':'line';
	
	var graph = new Rickshaw.Graph( {
		element: document.querySelector("#chart"),
		width: 930,
		height: 450,
		min: 'auto',		// minimum automatique, permet d'afficher des courbes en-dessous de zéro.
		renderer: 'area',	// alternative : 'line'
		stack: false,		// Est-ce qu'on empile les courbes ? Nécessite que les séries aient les mêmes dimensions
		stroke: true,
		preserve: true,
		interpolation: interpolation_choice,
		series: getGraphSeries()	// Récupère les séries à tracer
	} );

	var xAxis = new Rickshaw.Graph.Axis.X( {	// Créé l'axe X
		graph: graph,
		ticksTreatment: 'glow'
	} );

	var yAxis = new Rickshaw.Graph.Axis.Y( {	// Créé l'axe Y
		graph: graph
	} );

	var legend = new Rickshaw.Graph.Legend( {		// Affiche la légence
		element: document.querySelector('#legend'),
		graph: graph
	} );

	var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {		// Permet de cocher/décocher des séries dans la légende
		graph: graph,
		legend: legend
	} );

	/*var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {	// Mise en surbrillance des lignes au survol de la légende
		graph: graph,
		legend: legend
	} );*/

	var hoverDetail = new Rickshaw.Graph.HoverDetail( {		// Étiquettes affichée au survol
		graph: graph,
		xFormatter: function(x) { return "Tour " + x },
		yFormatter: function(y) { return Math.round(y*10)/10}
	} );

	/*var annotator = new Rickshaw.Graph.Annotate({		// Annotations d'évênements. Développement à poursuivre plus tard
		graph: graph,
		element: document.getElementById('timeline')
	});

	annotator.add(2, "Test Blabla");
	annotator.add(3.2, "<img src='http://static.leekwars.com/image/chip/lightning.png' width='30px'>");
	annotator.update();*/


	/*var offsetForm = document.getElementById('offset_form');
	offsetForm.addEventListener('change', function(e) {
		var offsetMode = e.target.value;

		if (offsetMode == 'line') {
			graph.setRenderer('line');
		}
		if (offsetMode == 'stack') {
			graph.setRenderer('stack');
		}
		if (offsetMode == 'pct') {
			graph.setRenderer('pct');
		}
		graph.update();
	}, false);*/

	graph.render();
}

// Ajoute une information sur le nombre d'erreurs et d'alertes présentes dans le debug
function add_error_notification() {
	
	var log_type = ['error', 'warning'];	// deux class à parser
	
	var div_1 = document.createElement('div');
	div_1.id = 'error_notification';
	
	for(var i = 0; i < log_type.length; i++){	// Boucle sur les types de notification qui nous intéressent : warning et erreur
		var logs = document.getElementsByClassName('log ' + log_type[i]);
		
		if(logs.length > 0){
			// Ajout d'un récap du nombre d'erreurs
			div_sum = document.createElement('div');
			div_sum.style.cursor = 'pointer';
			div_sum.className = 'log ' + log_type[i];
			div_sum.setAttribute('onclick', '$(\'#kikimeter_' + log_type[i] + '\').toggle()');	// Rend le div cliquable pour dérouler ou non le détail
			div_sum.textContent = logs.length + ' ' + log_type[i] + ((logs.length > 1) ? 's' : '');
			div_1.appendChild(div_sum);
			
			// div contenant le détail de toutes les notifications d'erreur
			div_2 = document.createElement('div');
			div_2.id = 'kikimeter_' + log_type[i];
			div_2.style.display = 'none';

			for(var j = 0; j < logs.length; j++) {
				var a = document.createElement('a');
				a.href = '#kikimeter_' + log_type[i] + j;	// Ajout d'un lien vers le code d'erreur dans le log du combat
				var temp_log = logs[j].cloneNode(true);		// Clonage du message d'erreur
				temp_log.className = temp_log.className.replace('first', '').replace('last', '');	// Supprime les classes css 'first' et 'last' qui produisent des margin inutiles
				a.appendChild(temp_log);
				div_2.appendChild(a);
				logs[j].id = 'kikimeter_' + log_type[i] + j;	// Création de l'id du code d'erreur dans le log, pour que le lien puisse y faire référence
			}
			div_1.appendChild(div_2);
		}
	}
	document.getElementById('duration').appendChild(div_1);
}

// Affiche les options de configuration
function displayConfig() {
	// Création de la div de configuration, avec bouton de toggle
	var configDiv = '<center><div class="button" id="kikimeter-config-toggle">Afficher/Masquer la configuration</div></center><div id="kikimeter-config-wrapper"><h1>Configuration</h1><div id="kikimeter-config" class="report"></div></div>';
	$(configDiv).insertBefore("#report-actions");
	var config = $('#kikimeter-config');
	var configWrapper = $('#kikimeter-config-wrapper');
	$('#kikimeter-config-toggle').click(function() {
		configWrapper.toggle();
	});
	configWrapper.toggle();

	// Configuration globale
	var configModulesDiv = '<h2>Affichage des modules</h2><div id="kikimeter-config-modules"></div>';
	config.append(configModulesDiv);

	var configModules = $('#kikimeter-config-modules');
	for (var key in leekikimeterModules) {
		var checked = GM_getValue(STORAGE_DISPLAY_PREFIX + key, 1);
		configModules.append('<div><input type="checkbox" id="' + STORAGE_DISPLAY_PREFIX + key + '" name="' + key + '"' + (checked == 1 ? 'checked' : '') + '/><label for="' + STORAGE_DISPLAY_PREFIX + key + '">' + leekikimeterModules[key] + '</label></div>');
	}
	$('#kikimeter-config-modules input[type=checkbox]').change(function() {
		var key = $(this).attr('name');
		var value = $(this).is(':checked') ? 1 : 0;
		GM_setValue(STORAGE_DISPLAY_PREFIX + key, value);
		$('#'+key).toggle();
	});

	// Configuration du tableau Résumé
	var configTableDiv = '<h2>Colonnes du Résumé</h2><div id="kikimeter-config-table"></div>';
	config.append(configTableDiv);

	var configTable = $('#kikimeter-config-table');
	for (var key in dispData) {
		configTable.append('<div><input type="checkbox" id="' + STORAGE_PREFIX + key + '" name="' + key + '"' + (dispData[key] == 1 ? 'checked' : '') + '/><label for="' + STORAGE_PREFIX + key + '">' + allData[key] + '</label></div>');
	}

	$('#kikimeter-config input[type=checkbox]').change(function() {
		var key = $(this).attr('name');
		var value = $(this).is(':checked') ? 1 : 0;
		dispData[key] = value;
		GM_setValue(STORAGE_PREFIX + key, value);
	});
	
	// Configuration du graph
	var configGraphDiv = '<h2>Graphique</h2><div id="kikimeter-config-graph"></div>';
	var key = 'graph-interpolation';
	var checked = GM_getValue(STORAGE_DISPLAY_PREFIX + key, 1);
	config.append(configGraphDiv);
	var configGraph = $('#kikimeter-config-graph');
	configGraph.append('<div><input type="checkbox" id="' + STORAGE_DISPLAY_PREFIX + key + '" name="' + key + '"' + (checked == 1 ? 'checked' : '') + '/><label for="' + STORAGE_DISPLAY_PREFIX + key + '">Lissage de courbe</label></div>');
	$('#kikimeter-config-graph input[type=checkbox]').change(function() {
		var key = $(this).attr('name');
		var value = $(this).is(':checked') ? 1 : 0;
		GM_setValue(STORAGE_DISPLAY_PREFIX + key, value);
	});

	// Configuration de l'URL d'envoi des données
	var configDataReceiverURLDiv = '<h2>URL d\'envoi des données (get.php)</h2><div id="kikimeter-config-dataReceiverURL"></div>';
	config.append(configDataReceiverURLDiv);
	var configDataReceiverURL = $('#kikimeter-config-dataReceiverURL');
	configDataReceiverURL.append('<div><input type="text" value="' + dataReceiverURL + '" id="kikimeter-field-dataReceiverURL"/></div>');
	var configDataReceiverURLField = $('#kikimeter-field-dataReceiverURL');
	configDataReceiverURLField.change(function() {
		dataReceiverURL = $(this).val();
		GM_setValue("kikimeter-dataReceiverURL", dataReceiverURL);
	});

	// Application des règles CSS
	config.css("margin-bottom", "50px");
	config.find('h2').css("margin-top", "20px");
	config.css("background", "none");
	configTable.css('column-count', 4);
	configTable.css('-moz-column-count', 4);
	configTable.css('-webkit-column-count', 4);
	configTable.css('column-gap', 25);
	configTable.css('-moz-column-gap', 25);
	configTable.css('-webkit-column-gap', 25);
	configDataReceiverURLField.css("width", "500px");
}

function initConfig() {
	for (var key in leekikimeterModules) {
		var display = GM_getValue(STORAGE_DISPLAY_PREFIX + key, 1);
		if (display == 0) {
			$("#"+key).hide();
		}
	}
}

//	Permet de trier les tableaux html en appelant le script présenté ici : http://www.kryogenix.org/code/browser/sorttable
function make_tables_sortable() {
	sorttable.init();
	Array.prototype.slice.call(document.getElementById('page').getElementsByTagName('table')).forEach(
		function(t) {
			sorttable.makeSortable(t);
		}
	)
}


// FONCTIONS STATISTIQUES //
// maximum of an array
function max(arr) {
	var max = null;
	for (var i in arr) {
		if (arr[i] > max || max == null) max = arr[i];
	}
	return max;
}

// minimum of an array
function min(arr) {
	var min = null;
	for (var i in arr) {
		if (arr[i] < min || min == null) min = arr[i];
	}
	return min;
}

// Taille réelle d'un tableau (arr.length n'est pas fiable)
function length(arr) {
	var length = 0;
	for (i in arr) {
		length++;
	}
	return length;
}

// sum of an array
function sum(arr) {
	var sum = 0;
	for (var i in arr) {
		sum += arr[i];
	}
	return sum;
}

// mean value of an array
function mean(arr) {
	return sum(arr) / length(arr);
}

// sum of squared errors of prediction (SSE)
function sumsqerr(arr) {
	var sum = 0;
	var tmp;
	for (var i in arr) {
		tmp = arr[i] - mean(arr);
		sum += tmp * tmp;
	}
	return sum;
}

// variance of an array (for a population, not a sample)
function variance(arr) {
	return sumsqerr(arr) / (length(arr) - 1);
}

// standard deviation of an array
function stdev(arr) {
	return Math.sqrt(variance(arr));
}

// Truc AJAX pour envoyer les données à la page PHP
function getXMLHttpRequest() {
	var xhr = null;

	if (window.XMLHttpRequest || window.ActiveXObject) {
		if (window.ActiveXObject) {
			try {
				xhr = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}
		} else {
			xhr = new XMLHttpRequest();
		}
	} else {
		alert("Votre navigateur ne supporte pas l'objet XMLHTTPRequest...");
		return null;
	}

	return xhr;
}

var rawFightData; // Objet stockant les données du combat récupérées depuis la page http://leekwars.com/fight_get
var currentFight; // Stock les données du combat
var Highlights = {}; // Stock la liste des Hauts faits

// Récupère les données brutes du combat. Ce sont celles exploitées par l'animation de la page http://leekwars.com/report/xxxxxxx
var urlTab = document.URL.split('/');
var fight_id = parseInt(urlTab[urlTab.length - 1]);

// Permet d'attendre que jQuery soit chargé avant d'exécuter le script
function defer() {
	if (window.$) {
		$.post(
			'http://leekwars.com/fight_get',
			'id=' + fight_id,
			function(data) { // Une fois les données récupérées, on exécute le programme principal
				main(data);
			}
		);
	} else {
		setTimeout(function() {
			defer();
		}, 50);
	}
}

defer();

// Fonction principale appelant les différents objets et fonctions d'affichage une fois les données brutes du combat chargées
function main(data) {

	rawFightData = JSON.parse(data);
	currentFight = new Fight();

	// LECTURE DES TABLEAUX
	readTables();

	// LECTURE DES ACTIONS
	readActions();

	currentFight.sumRounds();

	// CRÉATION DU RÉSUMÉ
	displayKikimeter();

	// CRÉATION DU GRAPHE
	displayChart();

	// CRÉATION DU RÉCAP D'USAGE DES PT
	displayPTusageTable();

	// AFFICHAGE DES HAUTS FAITS (HIGHLIGHTS)
	displayHighlights();

	// AFFICHE LES OPTIONS DE CONFIGURATION
	displayConfig();
	
	// AJOUT DES NOTIFICATIONS D'ERROR ET WARNING EN TÊTE DE RAPPORT
	add_error_notification();

	// APPLIQUE LA CONFIGURATION EXISTANTE
	initConfig();

	// MISE EN COULEUR DU NOM DES POIREAUX DANS LE RAPPORT GÉNÉRAL
	colorize_report_general();

	// PERMET DE TRIER LES TABLEAUX EN CLIQUANT SUR L'ENTÊTE
	make_tables_sortable();

	// ENVOI DES DONNÉES SUR UNE PAGE DISTANTE
	if (dataReceiverURL != '') {

		var serverFightData = [
			'fightId',
			'draw',
			'bonus',
			'nbRounds'
		];
		var serverLeekData = [
			'leekId',
			'name',
			'team',
			'alive',
			'level',
			'XP',
			'gainXP',
			'gainTalent',
			'gainHabs',
			'roundsPlayed',
			'usedPT',
			'usedPM',
			'equipWeapon',
			'actionsWeapon',
			'actionsChip',
			'dmg_in',
			'dmg_out',
			'heal_in',
			'heal_out',
			'vitality_in',
			'vitality_out',
			'fails',
			'lastHits',
			'blabla',
			'crashes'
		];

		var fightData = {};
		for (var j in serverFightData) {
			fightData[serverFightData[j]] = currentFight[serverFightData[j]];
		}

		var rowBDD = {};
		for (var i in currentFight.leeks) {
			rowBDD[i] = jQuery.extend({}, fightData);
			for (var j in serverLeekData) {
				rowBDD[i][serverLeekData[j]] = currentFight.leeks[i][serverLeekData[j]];
			}
		}

		var json = 'json=' + JSON.stringify(rowBDD); // mise au format JSON

		$.ajax({
			type: 'POST',
			url: dataReceiverURL,
			dataType: 'json',
			data: json,
			success: function(data) {
				console.log(json);
			}
		});
	}
}
